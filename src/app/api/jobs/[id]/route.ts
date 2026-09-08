import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { RepurposeJob } from "@/models/RepurposeJob";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const job = await RepurposeJob.findById(id).lean();

    if (!job) {
      return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
    }

    return NextResponse.json({ success: true, job });
  } catch (error) {
    console.error("Lỗi lấy chi tiết job:", error);
    return NextResponse.json({ error: "Lỗi tìm kiếm bài viết" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    await RepurposeJob.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Đã xóa bài viết thành công" });
  } catch (error) {
    console.error("Lỗi xóa job:", error);
    return NextResponse.json({ error: "Lỗi xóa bài viết" }, { status: 500 });
  }
}
