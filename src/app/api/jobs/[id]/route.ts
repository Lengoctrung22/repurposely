import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { RepurposeJob } from "@/models/RepurposeJob";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "ID bài viết không đúng định dạng ObjectId" }, { status: 400 });
    }

    await connectToDatabase();
    const job = await RepurposeJob.findById(id).lean();

    if (!job) {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Lỗi lấy chi tiết job:", error);
    const msg = error instanceof Error ? error.message : "Lỗi tìm kiếm bài viết";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || !mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "ID bài viết không đúng định dạng ObjectId" }, { status: 400 });
    }

    await connectToDatabase();
    const job = await RepurposeJob.findById(id);

    if (!job) {
      return NextResponse.json({ error: "Không tìm thấy bài viết để xóa" }, { status: 404 });
    }

    // IDOR Protection: Kiểm tra quyền sở hữu bài viết
    const authUser = getAuthenticatedUser(req);
    if (
      authUser &&
      authUser.role !== "admin" &&
      job.userEmail &&
      job.userEmail !== "guest@repurposely.ai" &&
      job.userEmail !== authUser.email
    ) {
      return NextResponse.json(
        { error: "Bạn không có quyền xóa bài viết của người dùng khác" },
        { status: 403 }
      );
    }

    await RepurposeJob.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Đã xóa bài viết thành công" });
  } catch (error) {
    console.error("Lỗi xóa job:", error);
    const msg = error instanceof Error ? error.message : "Lỗi xóa bài viết";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
