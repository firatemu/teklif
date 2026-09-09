import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { id } = await params;
  const quoteId = parseInt(id, 10);

  if (isNaN(quoteId)) {
    return NextResponse.json({ error: "Geçersiz teklif ID" }, { status: 400 });
  }

  try {
    const original = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        classicItems: true,
        planComparisonItems: true,
      },
    });

    if (!original) {
      return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
    }

    const duplicated = await prisma.$transaction(async (tx) => {
      const tempNumber = `TEMP-${Date.now()}`;
      const newQuote = await tx.quote.create({
        data: {
          quoteNumber: tempNumber,
          quoteType: original.quoteType,
          quoteDate: new Date(), // Today
          customerName: original.customerName,
          customerTaxOffice: original.customerTaxOffice,
          customerTaxNumber: original.customerTaxNumber,
          customerPhone: original.customerPhone,
          customerEmail: original.customerEmail,
          generalDiscountType: original.generalDiscountType,
          generalDiscountValue: original.generalDiscountValue,
          vatRate: original.vatRate,
          subtotal: original.subtotal,
          netAfterDiscount: original.netAfterDiscount,
          vatAmount: original.vatAmount,
          totalAmount: original.totalAmount,
          notes: original.notes,
          preparedByName: original.preparedByName,
        },
      });

      const quoteNumber = `AZM-${String(newQuote.id).padStart(4, "0")}`;
      const updated = await tx.quote.update({
        where: { id: newQuote.id },
        data: { quoteNumber },
      });

      if (original.quoteType === "CLASSIC" && original.classicItems.length > 0) {
        await tx.quoteClassicItem.createMany({
          data: original.classicItems.map((it) => ({
            quoteId: newQuote.id,
            productId: it.productId,
            displayName: it.displayName,
            selectedPlan: it.selectedPlan,
            priceBasis: it.priceBasis,
            unitPrice: it.unitPrice,
            quantity: it.quantity,
            lineDiscountType: it.lineDiscountType,
            lineDiscountValue: it.lineDiscountValue,
            lineTotal: it.lineTotal,
            sortOrder: it.sortOrder,
          })),
        });
      } else if (original.quoteType === "PLAN_COMPARISON" && original.planComparisonItems.length > 0) {
        await tx.quotePlanComparisonItem.createMany({
          data: original.planComparisonItems.map((it) => ({
            quoteId: newQuote.id,
            productId: it.productId,
            displayName: it.displayName,
            plan1FirstYear: it.plan1FirstYear,
            plan1Renewal: it.plan1Renewal,
            plan2FirstYear: it.plan2FirstYear,
            plan2Renewal: it.plan2Renewal,
            plan3FirstYear: it.plan3FirstYear,
            plan3Renewal: it.plan3Renewal,
            sortOrder: it.sortOrder,
          })),
        });
      }

      return updated;
    });

    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    console.error("Duplicate error:", error);
    return NextResponse.json(
      { error: "Teklif kopyalanırken hata oluştu." },
      { status: 500 }
    );
  }
}
