import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const expectedUser = process.env.ADMIN_USERNAME || "admin";
    const passwordHash = process.env.ADMIN_PASSWORD_HASH || "";

    if (!username || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve şifre gereklidir." },
        { status: 400 }
      );
    }

    if (username !== expectedUser) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı adı veya şifre." },
        { status: 401 }
      );
    }

    const isValid = await bcrypt.compare(password, passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Geçersiz kullanıcı adı veya şifre." },
        { status: 401 }
      );
    }

    await createSession(username);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Giriş yapılırken sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
