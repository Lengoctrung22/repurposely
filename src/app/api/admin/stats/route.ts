import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { RepurposeJob } from "@/models/RepurposeJob";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      bannedUsers,
      adminUsers,
      totalJobs,
      jobsToday,
      youtubeCount,
      articleCount,
      rawTextCount,
      recentJobs,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: { $ne: "banned" } }),
      User.countDocuments({ status: "banned" }),
      User.countDocuments({ role: "admin" }),
      RepurposeJob.countDocuments(),
      RepurposeJob.countDocuments({ createdAt: { $gte: startOfToday } }),
      RepurposeJob.countDocuments({ sourceType: "youtube" }),
      RepurposeJob.countDocuments({ sourceType: "article" }),
      RepurposeJob.countDocuments({ sourceType: "raw_text" }),
      RepurposeJob.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .select("sourceTitle sourceType userEmail createdAt tone")
        .lean(),
      User.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .select("name email role status authProvider createdAt")
        .lean(),
    ]);

    const formattedRecentUsers = (recentUsers as any[]).map((u) => ({
      ...u,
      role: u.role || "user",
      status: u.status || "active",
    }));

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        bannedUsers,
        adminUsers,
        totalJobs,
        jobsToday,
        distribution: {
          youtube: youtubeCount,
          article: articleCount,
          rawText: rawTextCount,
        },
        recentJobs,
        recentUsers: formattedRecentUsers,
      },
    });
  } catch (error: unknown) {
    console.error("Lỗi lấy số liệu Admin Stats:", error);
    const msg = error instanceof Error ? error.message : "Lỗi truy vấn số liệu thống kê";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
