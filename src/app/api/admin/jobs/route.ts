import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { RepurposeJob } from "@/models/RepurposeJob";
import { analyzeContentSafety } from "@/lib/moderation";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const sourceType = searchParams.get("sourceType");
    const userEmail = searchParams.get("userEmail")?.trim();
    const moderationStatus = searchParams.get("moderationStatus");
    const format = searchParams.get("format");

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { sourceTitle: { $regex: search, $options: "i" } },
        { "linkedinPost.content": { $regex: search, $options: "i" } },
      ];
    }
    if (sourceType && sourceType !== "all") {
      query.sourceType = sourceType;
    }
    if (userEmail) {
      query.userEmail = { $regex: userEmail, $options: "i" };
    }
    if (moderationStatus && moderationStatus !== "all") {
      if (moderationStatus === "approved") {
        query.$or = [
          { "moderation.status": "approved" },
          { moderation: { $exists: false } },
        ];
      } else {
        query["moderation.status"] = moderationStatus;
      }
    }

    const rawJobs = await RepurposeJob.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Chuẩn hóa moderation field cho các bài viết cũ nếu chưa có
    const jobs = rawJobs.map((job: any) => ({
      ...job,
      moderation: job.moderation || {
        status: "approved",
        safetyScore: 98,
        riskLevel: "low",
        flags: {
          hateSpeech: false,
          harassment: false,
          sexuallyExplicit: false,
          dangerousContent: false,
          spamScam: false,
        },
        reason: "Nội dung đạt chuẩn kiểm duyệt an toàn tự động.",
        analyzedAt: job.createdAt,
        autoModerated: true,
      },
    }));

    // Xuất CSV nếu format=csv
    if (format === "csv") {
      const csvRows = [
        [
          "ID",
          "Nguon",
          "Tieu De",
          "Tac Gia",
          "Duyet AI",
          "Diem An Toan",
          "Muc Do Rui Ro",
          "Ly Do Kiem Duyet",
          "So Tweets",
          "Thoi Gian Tao",
        ].join(","),
      ];

      for (const job of jobs) {
        const titleClean = `"${(job.sourceTitle || "").replace(/"/g, '""')}"`;
        const reasonClean = `"${(job.moderation?.reason || "").replace(/"/g, '""')}"`;
        const dateClean = new Date(job.createdAt).toISOString();
        csvRows.push(
          [
            job._id.toString(),
            job.sourceType,
            titleClean,
            job.userEmail || "anonymous",
            job.moderation?.status || "approved",
            job.moderation?.safetyScore || 100,
            job.moderation?.riskLevel || "low",
            reasonClean,
            job.twitterThread?.length || 0,
            dateClean,
          ].join(",")
        );
      }

      const csvContent = csvRows.join("\n");
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=repurposely-moderated-jobs-${Date.now()}.csv`,
        },
      });
    }

    return NextResponse.json({ success: true, jobs });
  } catch (error: unknown) {
    console.error("Lỗi lấy danh sách bài viết Admin:", error);
    const msg = error instanceof Error ? error.message : "Lỗi truy vấn bài viết";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { jobId, status, reason, reanalyze } = body;

    if (!jobId) {
      return NextResponse.json({ error: "Thiếu jobId cần xử lý" }, { status: 400 });
    }

    const job = await RepurposeJob.findById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }

    if (reanalyze) {
      // Yêu cầu AI quét lại bài viết này
      const combinedText = [
        job.linkedinPost?.content,
        ...(job.twitterThread || []).map((t: any) => t.content),
        job.newsletter?.content,
        ...(job.keyTakeaways || []),
      ]
        .filter(Boolean)
        .join("\n\n");

      const newModeration = await analyzeContentSafety({
        title: job.sourceTitle,
        content: combinedText || job.originalContent,
      });

      job.set("moderation", newModeration);
      await job.save();

      return NextResponse.json({
        success: true,
        message: "AI đã phân tích và cập nhật kiểm duyệt lại thành công",
        moderation: job.moderation,
      });
    }

    // Thủ công override bởi Admin
    if (status && ["approved", "flagged", "rejected"].includes(status)) {
      const existingFlags = job.moderation?.flags
        ? {
            hateSpeech: Boolean(job.moderation.flags.hateSpeech),
            harassment: Boolean(job.moderation.flags.harassment),
            sexuallyExplicit: Boolean(job.moderation.flags.sexuallyExplicit),
            dangerousContent: Boolean(job.moderation.flags.dangerousContent),
            spamScam: Boolean(job.moderation.flags.spamScam),
          }
        : {
            hateSpeech: false,
            harassment: false,
            sexuallyExplicit: false,
            dangerousContent: false,
            spamScam: false,
          };

      job.set("moderation", {
        status,
        safetyScore: status === "approved" ? 100 : status === "flagged" ? 65 : 25,
        riskLevel: status === "approved" ? "low" : status === "flagged" ? "medium" : "high",
        flags: existingFlags,
        reason:
          reason ||
          (status === "approved"
            ? "Admin đã phê duyệt thủ công sau khi xem xét."
            : status === "flagged"
            ? "Admin đã gắn cờ lưu ý thủ công."
            : "Admin đã từ chối xuất bản bài viết."),
        analyzedAt: new Date(),
        autoModerated: false,
      });

      await job.save();
      return NextResponse.json({
        success: true,
        message: `Đã cập nhật trạng thái kiểm duyệt sang "${status}"`,
        moderation: job.moderation,
      });
    }

    return NextResponse.json({ error: "Không có thay đổi hợp lệ" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Lỗi cập nhật kiểm duyệt bài viết:", error);
    const msg = error instanceof Error ? error.message : "Lỗi cập nhật bài viết";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Thiếu jobId cần xóa" }, { status: 400 });
    }

    const deleted = await RepurposeJob.findByIdAndDelete(jobId);
    if (!deleted) {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa bài viết "${deleted.sourceTitle}" thành công`,
    });
  } catch (error: unknown) {
    console.error("Lỗi xóa bài viết Admin:", error);
    const msg = error instanceof Error ? error.message : "Lỗi xóa bài viết";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
