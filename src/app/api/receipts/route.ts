import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { amountToTurkishWords } from "@/lib/turkish-words";
import { isPaymentMethod } from "@/lib/payment-methods";

/** Makbuz numarası: ilk kayıt TS-0100'den başlar (id + 99). */
const RECEIPT_NUMBER_OFFSET = 99;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const quoteIdParam = searchParams.get("quoteId");

  try {
    const where: any = {};

    if (quoteIdParam) {
      const quoteId = parseInt(quoteIdParam, 10);
      if (!isNaN(quoteId)) where.quoteId = quoteId;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { receiptNumber: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const receipts = await prisma.paymentReceipt.findMany({
      where,
      include: {
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            quoteType: true,
            customerName: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { receiptDate: "desc" },
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("Receipts GET error:", error);
    return NextResponse.json(
      { error: "Makbuzlar alınırken hata oluştu." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  try {
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

    const receiptDate = data.receiptDate ? new Date(data.receiptDate) : new Date();
    const amountInWords = amountToTurkishWords(amount);

    const receipt = await prisma.$transaction(async (tx) => {
      const created = await tx.paymentReceipt.create({
        data: {
          receiptNumber: `TEMP-${Date.now()}`,
          receiptDate,
          quoteId,
          customerName,
          customerTaxOffice: data.customerTaxOffice?.trim() || null,
          customerTaxNumber: data.customerTaxNumber?.trim() || null,
          customerPhone: data.customerPhone?.trim() || null,
          customerEmail: data.customerEmail?.trim() || null,
          amount,
          amountInWords,
          paymentMethod: data.paymentMethod,
          description: data.description?.trim() || null,
          preparedByName: data.preparedByName?.trim() || null,
        },
      });

      const receiptNumber = `TS-${String(
        created.id + RECEIPT_NUMBER_OFFSET
      ).padStart(4, "0")}`;

      return tx.paymentReceipt.update({
        where: { id: created.id },
        data: { receiptNumber },
        include: { quote: true },
      });
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error("Receipt POST error:", error);
    return NextResponse.json(
      { error: "Makbuz kaydedilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
