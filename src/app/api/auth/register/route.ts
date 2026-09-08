import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Vui lòng nhập họ và tên hợp lệ (tối thiểu 2 ký tự)" },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { error: "Địa chỉ email không đúng định dạng" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có độ dài ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    // 2. Kết nối MongoDB
    await connectToDatabase();

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác." },
        { status: 409 }
      );
    }

    // 4. Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Tạo tài khoản trong MongoDB
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      authProvider: "credentials",
      role: "user",
    });

    return NextResponse.json({
      success: true,
      message: "Đăng ký tài khoản thành công!",
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error: unknown) {
    console.error("Lỗi đăng ký tài khoản:", error);
    const msg = error instanceof Error ? error.message : "Đã xảy ra lỗi trong quá trình đăng ký";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
