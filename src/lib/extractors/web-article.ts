import * as cheerio from "cheerio";

export interface ArticleExtractionResult {
  url: string;
  title: string;
  content: string;
  wordCount: number;
}

export async function fetchWebArticle(url: string): Promise<ArticleExtractionResult> {
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Giao thức URL không hợp lệ (cần bắt đầu bằng http:// hoặc https://)");
    }
  } catch {
    throw new Error("URL bài viết không hợp lệ");
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 RepurposelyBot/1.0",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "vi,en-US,en;q=0.9",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Không thể truy cập trang web (Mã lỗi HTTP: ${response.status})`);
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
