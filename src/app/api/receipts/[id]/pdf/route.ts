import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateReceiptPdf } from "@/lib/pdf/generator";

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

    // Teklif bağlantısı varsa toplam / kalan tutar bilgisini makbuza ekle
    let enriched: any = receipt;
    if (receipt.quoteId) {
      const [quote, collected] = await Promise.all([
        prisma.quote.findUnique({ where: { id: receipt.quoteId } }),
        prisma.paymentReceipt.aggregate({
          where: { quoteId: receipt.quoteId },
          _sum: { amount: true },
        }),
      ]);

      if (quote) {
        const collectedAmount = collected._sum.amount || 0;
        enriched = {
          ...receipt,
          quoteNumber: quote.quoteNumber,
          quoteTotalAmount: quote.totalAmount,
          quoteRemainingAmount: Math.max(quote.totalAmount - collectedAmount, 0),
        };
      }
    }

    const pdfBuffer = await generateReceiptPdf(enriched);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${receipt.receiptNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Receipt PDF generation error:", error);
    return NextResponse.json(
      { error: "PDF oluşturulurken bir hata meydana geldi." },
      { status: 500 }
    );
  }
}
