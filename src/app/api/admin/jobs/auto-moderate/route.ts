import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { RepurposeJob } from "@/models/RepurposeJob";
import { analyzeContentSafety } from "@/lib/moderation";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    let forceAll = false;
    try {
      const body = await req.json();
      forceAll = Boolean(body.forceAll);
    } catch {
      // ignore empty body
    }

    const query: Record<string, unknown> = {};
    if (!forceAll) {
      query.$or = [
        { moderation: { $exists: false } },
        { "moderation.autoModerated": false },
      ];
    }

    const jobs = await RepurposeJob.find(query);

    let approvedCount = 0;
    let flaggedCount = 0;
    let rejectedCount = 0;

    for (const job of jobs) {
      const combinedText = [
        job.linkedinPost?.content,
        ...(job.twitterThread || []).map((t: any) => t.content),
        job.newsletter?.content,
        ...(job.keyTakeaways || []),
      ]
        .filter(Boolean)
        .join("\n\n");

      const modResult = await analyzeContentSafety({
        title: job.sourceTitle,
        content: combinedText || job.originalContent,
      });

      job.set("moderation", modResult);
      await job.save();

      if (modResult.status === "approved") approvedCount++;
      else if (modResult.status === "flagged") flaggedCount++;
      else if (modResult.status === "rejected") rejectedCount++;
    }

    return NextResponse.json({
      success: true,
      processedCount: jobs.length,
      approvedCount,
      flaggedCount,
      rejectedCount,
      message: `AI đã hoàn tất quét và kiểm duyệt tự động ${jobs.length} bài viết (${approvedCount} hợp lệ, ${flaggedCount} cảnh báo, ${rejectedCount} từ chối).`,
    });
  } catch (error: unknown) {
    console.error("Lỗi quét AI tự động toàn bộ:", error);
    const msg = error instanceof Error ? error.message : "Lỗi thực thi quét kiểm duyệt tự động";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
