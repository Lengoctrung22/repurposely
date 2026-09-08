import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { RepurposeJob } from "@/models/RepurposeJob";
import { analyzeContentSafety } from "@/lib/moderation";
import { requireAdmin } from "@/lib/server-auth";

const BATCH_LIMIT = 15; // Giới hạn tối đa 15 bài/lần quét để tránh Gateway Timeout (504) trên môi trường Serverless

export async function POST(req: NextRequest) {
  try {
    const authCheck = requireAdmin(req);
    if ("errorResponse" in authCheck) {
      return authCheck.errorResponse;
    }

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

    const totalMatching = await RepurposeJob.countDocuments(query);
    const jobs = await RepurposeJob.find(query).limit(BATCH_LIMIT);

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

    const remainingCount = Math.max(0, totalMatching - jobs.length);

    return NextResponse.json({
      success: true,
      processedCount: jobs.length,
      remainingCount,
      hasMore: remainingCount > 0,
      approvedCount,
      flaggedCount,
      rejectedCount,
      message: `AI đã hoàn tất quét đợt này (${jobs.length} bài: ${approvedCount} hợp lệ, ${flaggedCount} cảnh báo, ${rejectedCount} từ chối).${
        remainingCount > 0 ? ` Còn ${remainingCount} bài viết cần quét tiếp.` : ""
      }`,
    });
  } catch (error: unknown) {
    console.error("Lỗi quét AI tự động toàn bộ:", error);
    const msg = error instanceof Error ? error.message : "Lỗi thực thi quét kiểm duyệt tự động";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
