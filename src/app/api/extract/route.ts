import { NextRequest, NextResponse } from "next/server";
import { extractYouTubeVideoId, fetchYouTubeDetails } from "@/lib/extractors/youtube";
import { fetchWebArticle } from "@/lib/extractors/web-article";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Vui lòng cung cấp URL hợp lệ" },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    const isYouTube = extractYouTubeVideoId(trimmedUrl) !== null;

    if (isYouTube) {
      const result = await fetchYouTubeDetails(trimmedUrl);
      return NextResponse.json({
        success: true,
        sourceType: "youtube",
        title: result.title,
        content: result.transcript,
        wordCount: result.wordCount,
        hasCaptions: result.hasCaptions,
        url: trimmedUrl,
      });
    } else {
      const result = await fetchWebArticle(trimmedUrl);
      return NextResponse.json({
        success: true,
        sourceType: "article",
        title: result.title,
        content: result.content,
        wordCount: result.wordCount,
        url: trimmedUrl,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Đã xảy ra lỗi khi trích xuất dữ liệu";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
