import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // 1. Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ email và mật khẩu" },
        { status: 400 }
      );
    }

    // 2. Kết nối MongoDB
    await connectToDatabase();

    const normalizedEmail = email.trim().toLowerCase();

    // 3. Tìm user trong cơ sở dữ liệu
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { error: "Tài khoản không tồn tại. Vui lòng kiểm tra lại email hoặc đăng ký tài khoản mới." },
        { status: 401 }
      );
    }

    // 4. Kiểm tra xem tài khoản có bị khóa không
    if (user.status === "banned") {
      return NextResponse.json(
        { error: "Tài khoản của bạn đã bị khóa bởi Quản trị viên. Vui lòng liên hệ hỗ trợ." },
        { status: 403 }
      );
    }

    // 5. Kiểm tra xem tài khoản này có mật khẩu không (tránh trường hợp chỉ đăng nhập bằng Google)
    if (!user.password) {
      return NextResponse.json(
        { error: "Tài khoản này được tạo bằng Google OAuth. Vui lòng chọn 'Tiếp tục bằng Google'." },
        { status: 400 }
      );
    }

    // 5. Đối chiếu mật khẩu qua bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Mật khẩu không chính xác. Vui lòng thử lại." },
        { status: 401 }
      );
    }

    // 6. Đăng nhập thành công
    return NextResponse.json({
      success: true,
      message: "Đăng nhập thành công!",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role || "user",
        status: user.status || "active",
      },
    });
  } catch (error: unknown) {
    console.error("Lỗi đăng nhập:", error);
    const msg = error instanceof Error ? error.message : "Đã xảy ra lỗi trong quá trình đăng nhập";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
