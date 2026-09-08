import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { RepurposeJob } from "@/models/RepurposeJob";
import { requireAdmin } from "@/lib/server-auth";
import { escapeRegex } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const authCheck = requireAdmin(req);
    if ("errorResponse" in authCheck) {
      return authCheck.errorResponse;
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }
    if (roleFilter && roleFilter !== "all") {
      query.role = roleFilter;
    }
    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "active") {
        query.status = { $ne: "banned" };
      } else {
        query.status = statusFilter;
      }
    }

    const [totalUsers, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password")
        .lean(),
    ]);

    // Tối ưu hóa N+1 query: Gom số lượng bài viết bằng 1 aggregation pipeline duy nhất
    const userEmails = users.map((u) => u.email).filter(Boolean);
    const jobCounts = await RepurposeJob.aggregate([
      { $match: { userEmail: { $in: userEmails } } },
      { $group: { _id: "$userEmail", count: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>(jobCounts.map((item) => [item._id, item.count]));

    const usersWithCounts = users.map((u) => ({
      ...u,
      role: u.role || "user",
      status: u.status || "active",
      jobCount: countMap.get(u.email) || 0,
    }));

    return NextResponse.json({
      success: true,
      users: usersWithCounts,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit) || 1,
      },
    });
  } catch (error: unknown) {
    console.error("Lỗi lấy danh sách users Admin:", error);
    const msg = error instanceof Error ? error.message : "Lỗi truy vấn người dùng";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authCheck = requireAdmin(req);
    if ("errorResponse" in authCheck) {
      return authCheck.errorResponse;
    }

    await connectToDatabase();
    const body = await req.json();
    const { userId, role, status } = body;

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ error: "ID người dùng không hợp lệ" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (role && ["user", "admin"].includes(role)) {
      updateData.role = role;
    }
    if (status && ["active", "banned"].includes(status)) {
      updateData.status = status;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
      .select("-password")
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật tài khoản thành công",
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Lỗi cập nhật user Admin:", error);
    const msg = error instanceof Error ? error.message : "Lỗi cập nhật người dùng";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authCheck = requireAdmin(req);
    if ("errorResponse" in authCheck) {
      return authCheck.errorResponse;
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || !mongoose.isValidObjectId(userId)) {
      return NextResponse.json({ error: "ID người dùng không hợp lệ" }, { status: 400 });
    }

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return NextResponse.json({ error: "Không tìm thấy người dùng để xóa" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa tài khoản ${deleted.email} khỏi cơ sở dữ liệu`,
    });
  } catch (error: unknown) {
    console.error("Lỗi xóa user Admin:", error);
    const msg = error instanceof Error ? error.message : "Lỗi xóa người dùng";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
