import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Logo dosyası gereklidir." }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Sadece PNG, JPG veya WebP dosyaları kabul edilir." }, { status: 400 });
    }

    // Max 2MB
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Logo dosyası en fazla 2MB olabilir." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    // Ensure settings row exists
    const existing = await prisma.companySettings.findUnique({ where: { id: 1 } });
    if (!existing) {
      await prisma.companySettings.create({ data: { id: 1 } });
    }

    await prisma.companySettings.update({
      where: { id: 1 },
      data: {
        logoBase64: base64,
        logoMimeType: file.type,
      },
    });

    return NextResponse.json({ success: true, message: "Logo başarıyla yüklendi." });
  } catch (error) {
    console.error("Logo upload error:", error);
    return NextResponse.json({ error: "Logo yüklenirken hata oluştu." }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    await prisma.companySettings.update({
      where: { id: 1 },
      data: {
        logoBase64: null,
        logoMimeType: null,
      },
    });

    return NextResponse.json({ success: true, message: "Logo silindi." });
  } catch (error) {
    console.error("Logo delete error:", error);
    return NextResponse.json({ error: "Logo silinirken hata oluştu." }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const settings = await prisma.companySettings.findUnique({
    where: { id: 1 },
    select: { logoBase64: true, logoMimeType: true },
  });

  if (!settings?.logoBase64) {
    return NextResponse.json({ hasLogo: false });
  }

  return NextResponse.json({
    hasLogo: true,
    logoDataUrl: `data:${settings.logoMimeType};base64,${settings.logoBase64}`,
  });
}
