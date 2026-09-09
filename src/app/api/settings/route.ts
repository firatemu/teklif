import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function getOrCreateSettings() {
  let settings = await prisma.companySettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        id: 1,
        name: "Azem Yazılım Bilişim ve Teknolojileri Ltd. Şti.",
        shortName: "Azem Yazılım",
        tagline: "Logo Yazılım Yetkili İş Ortağı",
        address: "Üniversite Mah. Civan Sok. Allure Tower No: 1 Kat: 13 D: 147 Avcılar / İSTANBUL",
        taxOffice: "Avcılar V.D.",
        taxNumber: "1234567890",
        phone: "0 (212) 999 00 00",
        phone2: "0 (532) 000 00 00",
        email: "info@azemyazilim.com",
        website: "www.azemyazilim.com",
        city: "İstanbul",
      },
    });
  }
  return settings;
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const settings = await getOrCreateSettings();
  // Don't send logoBase64 in list - it can be huge
  const { logoBase64, ...rest } = settings;
  return NextResponse.json({ ...rest, hasLogo: !!logoBase64 });
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, shortName, tagline, address, taxOffice, taxNumber, phone, phone2, email, website, city } = body;

    await getOrCreateSettings();

    const settings = await prisma.companySettings.update({
      where: { id: 1 },
      data: {
        name: name || undefined,
        shortName: shortName || undefined,
        tagline: tagline ?? "",
        address: address ?? "",
        taxOffice: taxOffice ?? "",
        taxNumber: taxNumber ?? "",
        phone: phone ?? "",
        phone2: phone2 ?? "",
        email: email ?? "",
        website: website ?? "",
        city: city ?? "",
      },
    });

    const { logoBase64, ...rest } = settings;
    return NextResponse.json({ ...rest, hasLogo: !!logoBase64 });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Ayarlar güncellenirken hata oluştu." }, { status: 500 });
  }
}
