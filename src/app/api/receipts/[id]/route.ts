import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { amountToTurkishWords } from "@/lib/turkish-words";
import { isPaymentMethod } from "@/lib/payment-methods";

/** Form yalnızca YYYY-MM-DD gönderir. Aynı günse mevcut saati koru. */
function resolveReceiptDate(raw: unknown, existing: Date): Date {
  const now = new Date();
  if (!raw) return existing;
  const text = String(raw).trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? existing : parsed;
  }
  const [, y, m, d] = match.map(Number);
  const sameDay =
    existing.getFullYear() === y &&
    existing.getMonth() === m - 1 &&
    existing.getDate() === d;
  if (sameDay) return existing;
  return new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
}

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

export async function PUT(
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
    const existing = await prisma.paymentReceipt.findUnique({
      where: { id: receiptId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Makbuz bulunamadı" }, { status: 404 });
    }

    const data = await request.json();
    const customerName = data.customerName?.trim();
    if (!customerName) {
      return NextResponse.json(
        { error: "Müşteri / firma adı zorunludur." },
        { status: 400 }
      );
    }

    const amount = Number(data.amount);
    if (!isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Tutar sıfırdan büyük olmalıdır." },
        { status: 400 }
      );
    }

    if (!isPaymentMethod(data.paymentMethod)) {
      return NextResponse.json(
        { error: "Geçersiz ödeme şekli." },
        { status: 400 }
      );
    }

    let quoteId: number | null = null;
    if (data.quoteId) {
      const parsed = parseInt(String(data.quoteId), 10);
      if (!isNaN(parsed)) {
        const quote = await prisma.quote.findUnique({ where: { id: parsed } });
        if (!quote) {
          return NextResponse.json(
            { error: "İlgili teklif bulunamadı." },
            { status: 404 }
          );
        }
        quoteId = quote.id;
      }
    }

    const receipt = await prisma.paymentReceipt.update({
      where: { id: receiptId },
      data: {
        receiptDate: resolveReceiptDate(data.receiptDate, existing.receiptDate),
        quoteId,
        customerName,
        customerTaxOffice: data.customerTaxOffice?.trim() || null,
        customerTaxNumber: data.customerTaxNumber?.trim() || null,
        customerPhone: data.customerPhone?.trim() || null,
        customerEmail: data.customerEmail?.trim() || null,
        customerAddress: data.customerAddress?.trim() || null,
        amount,
        amountInWords: amountToTurkishWords(amount),
        paymentMethod: data.paymentMethod,
        otherPaymentMethod: data.otherPaymentMethod?.trim() || null,
        description: data.description?.trim() || null,
        bankInfo: data.bankInfo?.trim() || null,
        extraNotes: data.extraNotes?.trim() || null,
        preparedByName: data.preparedByName?.trim() || null,
      },
      include: { quote: true },
    });

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("Receipt PUT error:", error);
    return NextResponse.json(
      { error: "Makbuz güncellenirken bir hata oluştu." },
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
