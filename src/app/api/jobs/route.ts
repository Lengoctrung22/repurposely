import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { RepurposeJob } from "@/models/RepurposeJob";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get("userEmail");

    const query: Record<string, unknown> = {};
    if (userEmail) {
      query.userEmail = userEmail;
    }

    const jobs = await RepurposeJob.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error("Lỗi lấy danh sách jobs từ MongoDB:", error);
    return NextResponse.json({ success: true, jobs: [] });
  }
}
