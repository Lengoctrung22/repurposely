import * as cheerio from "cheerio";

export interface ArticleExtractionResult {
  url: string;
  title: string;
  content: string;
  wordCount: number;
}

/**
 * Kiểm tra xem hostname có thuộc dải mạng nội bộ hoặc IP riêng tư hay không (Chống tấn công SSRF)
 */
function isPrivateOrLocalHost(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();

  // 1. Localhost & loopback strings
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1" ||
    lower === "[::1]" ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.endsWith(".lan")
  ) {
    return true;
  }

  // 2. Cloud metadata endpoints (AWS, GCP, Azure)
  if (lower === "169.254.169.254" || lower.startsWith("169.254.")) {
    return true;
  }

  // 3. IPv4 pattern check cho dải mạng nội bộ (RFC 1918)
  const ipv4Match = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4Match) {
    const [, o1Str, o2Str] = ipv4Match;
    const o1 = parseInt(o1Str, 10);
    const o2 = parseInt(o2Str, 10);

    // 127.0.0.0/8 (Loopback)
    if (o1 === 127) return true;
    // 10.0.0.0/8 (Private)
    if (o1 === 10) return true;
    // 172.16.0.0/12 (Private)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
    // 192.168.0.0/16 (Private)
    if (o1 === 192 && o2 === 168) return true;
    // 0.0.0.0/8
    if (o1 === 0) return true;
  }

  return false;
}

export async function fetchWebArticle(url: string): Promise<ArticleExtractionResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Giao thức URL không hợp lệ (cần bắt đầu bằng http:// hoặc https://)");
    }
  } catch {
    throw new Error("URL bài viết không hợp lệ");
  }

  // SSRF Protection: Chặn các truy cập tới mạng nội bộ hoặc máy chủ cục bộ
  if (isPrivateOrLocalHost(parsedUrl.hostname)) {
    throw new Error("Không thể trích xuất nội dung từ địa chỉ mạng nội bộ hoặc máy chủ riêng tư (Bảo vệ an toàn hệ thống SSRF)");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 RepurposelyBot/1.0",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi,en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000), // Timeout sau 10 giây tránh treo kết nối
      next: { revalidate: 3600 },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error("Quá thời gian chờ phản hồi từ trang web (Timeout 10s). Vui lòng thử lại sau.");
    }
    throw err;
  }

  if (!response.ok) {
    throw new Error(`Không thể truy cập trang web (Mã lỗi HTTP: ${response.status})`);
  }

  // Kiểm tra kích thước phản hồi tránh tràn bộ nhớ RAM (> 5MB)
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024) {
    throw new Error("Trang web quá lớn (vượt quá giới hạn cho phép 5MB)");
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // 1. Loại bỏ các phần tử thừa không chứa nội dung chính
  $(
    "script, style, noscript, iframe, svg, nav, footer, header, aside, .advertisement, .ads, .comment-section, .comments, .sidebar, .cookie-banner, .social-share"
  ).remove();

  // 2. Trích xuất Tiêu đề
  let title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    "Bài viết không tiêu đề";

  title = title.replace(/\s+/g, " ").trim();

  // 3. Tìm vùng chứa nội dung bài viết
  let articleText = "";

  const candidateSelectors = [
    "article",
    '[itemprop="articleBody"]',
    ".article-content",
    ".post-content",
    ".entry-content",
    ".content-area",
    "main",
    "#content",
  ];

  for (const selector of candidateSelectors) {
    const el = $(selector);
    if (el.length > 0 && el.text().trim().length > 200) {
      articleText = el.text();
      break;
    }
  }

  // Nếu không tìm thấy vùng đặc biệt, lấy các đoạn thẻ <p>
  if (!articleText || articleText.length < 200) {
    const paragraphs: string[] = [];
    $("p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 30) {
        paragraphs.push(text);
      }
    });
    articleText = paragraphs.join("\n\n");
  }

  // Làm sạch chuỗi
  const cleanedContent = articleText
    .replace(/\r\n|\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (cleanedContent.length < 80) {
    throw new Error("Không thể trích xuất nội dung bài viết từ URL này. Vui lòng kiểm tra lại trang web hoặc dán trực tiếp nội dung văn bản.");
  }

  const wordCount = cleanedContent.split(/\s+/).length;

  return {
    url,
    title,
    content: cleanedContent,
    wordCount,
  };
}
