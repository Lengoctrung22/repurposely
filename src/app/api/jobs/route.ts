import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { RepurposeJob } from "@/models/RepurposeJob";
import { getAuthenticatedUser } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const requestedEmail = searchParams.get("userEmail");
    const authUser = getAuthenticatedUser(req);

    const query: Record<string, unknown> = {};

    // IDOR Protection: Nếu người dùng đã đăng nhập (và không phải admin), chỉ cho phép truy vấn bài của chính mình
    if (authUser && authUser.role !== "admin") {
      query.userEmail = authUser.email;
    } else if (requestedEmail) {
      query.userEmail = requestedEmail;
    }

    const jobs = await RepurposeJob.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("Lỗi lấy danh sách jobs từ MongoDB:", error);
    const msg = error instanceof Error ? error.message : "Lỗi kết nối cơ sở dữ liệu";
    return NextResponse.json({ error: msg, success: false }, { status: 500 });
  }
}
