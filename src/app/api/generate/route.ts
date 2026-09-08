import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { RepurposeJob } from "@/models/RepurposeJob";
import { generateSocialContent, GenerationParams } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      content,
      sourceType = "article",
      sourceUrl = "",
      tone = "professional",
      userEmail,
      customInstructions,
      apiKey: clientApiKey,
    } = body;

    const headerApiKey = req.headers.get("x-gemini-api-key");
    const activeApiKey = clientApiKey || headerApiKey || process.env.GEMINI_API_KEY;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp tiêu đề và nội dung để xử lý" },
        { status: 400 }
      );
    }

    // 1. Gọi Gemini Engine sinh nội dung
    const genParams: GenerationParams = {
      title,
      content,
      sourceType,
      tone,
      customInstructions,
      apiKey: activeApiKey,
    };

    const generated = await generateSocialContent(genParams);

    // 2. Lưu vào MongoDB qua Mongoose
    let savedJobId: string | null = null;
    try {
      await connectToDatabase();
      const job = await RepurposeJob.create({
        userEmail: userEmail || "guest@repurposely.ai",
        sourceType,
        sourceUrl,
        sourceTitle: title,
        originalContent: content.slice(0, 10000), // Lưu tối đa 10k ký tự mẫu
        tone,
        linkedinPost: generated.linkedinPost,
        twitterThread: generated.twitterThread,
        newsletter: generated.newsletter,
        keyTakeaways: generated.keyTakeaways,
      });
      savedJobId = job._id.toString();
    } catch (dbErr) {
      console.warn("Không thể lưu vào MongoDB (hãy kiểm tra xem MongoDB server có đang chạy):", dbErr);
    }

    return NextResponse.json({
      success: true,
      jobId: savedJobId,
      data: generated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Lỗi xử lý sinh bài viết";
    console.error("API /api/generate Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
