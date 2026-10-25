import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { id } = await params;
  const receiptId = parseInt(id, 10);
  if (isNaN(receiptId)) {
    return NextResponse.json({ error: "Geçersiz makbuz ID" }, { status: 400 });
  }

  try {
    const receipt = await prisma.paymentReceipt.findUnique({
      where: { id: receiptId },
      include: { quote: true },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Makbuz bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Receipt GET error:", error);
    return NextResponse.json(
      { error: "Makbuz alınırken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { id } = await params;
  const receiptId = parseInt(id, 10);
  if (isNaN(receiptId)) {
    return NextResponse.json({ error: "Geçersiz makbuz ID" }, { status: 400 });
  }

  try {
    const receipt = await prisma.paymentReceipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      return NextResponse.json({ error: "Makbuz bulunamadı" }, { status: 404 });
    }

    await prisma.paymentReceipt.delete({ where: { id: receiptId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Receipt DELETE error:", error);
    return NextResponse.json(
      { error: "Makbuz silinirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
