import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { RepurposeJob } from "@/models/RepurposeJob";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const sourceType = searchParams.get("sourceType");
    const userEmail = searchParams.get("userEmail")?.trim();
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

    const jobs = await RepurposeJob.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Xuất CSV nếu format=csv
    if (format === "csv") {
      const csvRows = [
        ["ID", "Nguon", "Tieu De", "Tac Gia", "Giong Dieu", "So Tweets", "Thoi Gian Tao"].join(","),
      ];

      for (const job of jobs) {
        const titleClean = `"${(job.sourceTitle || "").replace(/"/g, '""')}"`;
        const dateClean = new Date(job.createdAt).toISOString();
        csvRows.push(
          [
            job._id.toString(),
            job.sourceType,
            titleClean,
            job.userEmail || "anonymous",
            job.tone || "professional",
            job.twitterThread?.length || 0,
            dateClean,
          ].join(",")
        );
      }

      const csvContent = csvRows.join("\n");
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename=repurposely-jobs-export-${Date.now()}.csv`,
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
