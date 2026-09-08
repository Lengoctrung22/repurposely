import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { RepurposeJob } from "@/models/RepurposeJob";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");

    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
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

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .select("-password")
      .lean();

    // Tính toán số lượng bài viết của từng user
    const usersWithCounts = await Promise.all(
      users.map(async (u: any) => {
        const jobCount = await RepurposeJob.countDocuments({ userEmail: u.email });
        return {
          ...u,
          role: u.role || "user",
          status: u.status || "active",
          jobCount,
        };
      })
    );

    return NextResponse.json({ success: true, users: usersWithCounts });
  } catch (error: unknown) {
    console.error("Lỗi lấy danh sách users Admin:", error);
    const msg = error instanceof Error ? error.message : "Lỗi truy vấn người dùng";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, role, status } = body;

    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId cần cập nhật" }, { status: 400 });
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
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId cần xóa" }, { status: 400 });
    }

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
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
