import { YoutubeTranscript } from "youtube-transcript";

export interface YouTubeExtractionResult {
  videoId: string;
  title: string;
  transcript: string;
  wordCount: number;
  hasCaptions: boolean;
}

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

export async function fetchYouTubeDetails(url: string): Promise<YouTubeExtractionResult> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Đường dẫn YouTube không hợp lệ. Vui lòng nhập link video, YouTube Shorts hoặc ID 11 ký tự.");
  }

  // 1. Fetch Video Title and Author via oEmbed
  let title = `YouTube Video (${videoId})`;
  let authorName = "";
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oEmbedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.title) title = data.title;
      if (data.author_name) authorName = data.author_name;
    }
  } catch (err) {
    console.warn("Không thể lấy oEmbed title cho video:", videoId, err);
  }

  // 2. Thử lấy phụ đề qua YoutubeTranscript
  try {
    let transcriptItems = null;

    try {
      transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: "vi" });
    } catch {
      try {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
      } catch {
        transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      }
    }

    if (transcriptItems && transcriptItems.length > 0) {
      const fullTranscript = transcriptItems
        .map((item) => item.text.trim())
        .filter(Boolean)
        .join(" ")
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"');

      const wordCount = fullTranscript.split(/\s+/).length;

      return {
        videoId,
        title,
        transcript: fullTranscript,
        wordCount,
        hasCaptions: true,
      };
    }
  } catch (transcriptErr) {
    console.warn("Không tìm thấy transcript tự động, đang thử lấy metadata/mô tả video:", transcriptErr);
  }

  // 3. Fallback: Nếu video không có phụ đề, crawl trang YouTube để lấy mô tả (description)
  try {
    const ytPageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "vi,en-US,en;q=0.9",
      },
    });

    if (ytPageRes.ok) {
      const pageHtml = await ytPageRes.text();
      
      // Tìm description trong meta tags
      const metaMatch = pageHtml.match(/<meta name="description" content="([^"]+)"/);
      const desc = metaMatch ? metaMatch[1].replace(/\\n/g, "\n").trim() : "";

      if (desc && desc.length > 50) {
        const synthesizedContent = `Video: ${title}\nTác giả / Kênh: ${authorName || "YouTube Creator"}\n\nMô tả chi tiết nội dung video:\n${desc}`;
        return {
          videoId,
          title,
          transcript: synthesizedContent,
          wordCount: synthesizedContent.split(/\s+/).length,
          hasCaptions: false,
        };
      }
    }
  } catch (pageErr) {
    console.warn("Không thể fetch trang YouTube video:", pageErr);
  }

  // 4. Nếu hoàn toàn không có phụ đề lẫn mô tả
  throw new Error(
    `Video "${title}" không có phụ đề (CC) công khai và không có phần mô tả khả dụng. Vui lòng thử video có bật phụ đề, hoặc sao chép nội dung/ghi chú vào tab "Dán văn bản thô".`
  );
}
