import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calculateQuote, calculateLineItem } from "@/lib/calculations";

export async function GET(
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
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        classicItems: {
          orderBy: { sortOrder: "asc" },
        },
        planComparisonItems: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Quote GET error:", error);
    return NextResponse.json(
      { error: "Teklif getirilirken hata oluştu." },
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
  const quoteId = parseInt(id, 10);

  if (isNaN(quoteId)) {
    return NextResponse.json({ error: "Geçersiz teklif ID" }, { status: 400 });
  }

  try {
    const existing = await prisma.quote.findUnique({
      where: { id: quoteId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
    }

    const data = await request.json();

    if (!data.customerName || !data.customerName.trim()) {
      return NextResponse.json(
        { error: "Müşteri adı zorunludur." },
        { status: 400 }
      );
    }

    const isClassic = existing.quoteType === "CLASSIC";

    let subtotal = 0;
    let netAfterDiscount = 0;
    let vatAmount = 0;
    let totalAmount = 0;

    let processedClassicItems: any[] = [];
    let processedPlanItems: any[] = [];

    if (isClassic) {
      if (!data.classicItems || data.classicItems.length === 0) {
        return NextResponse.json(
          { error: "En az bir teklif kalemi eklenmelidir." },
          { status: 400 }
        );
      }

      processedClassicItems = data.classicItems.map((item: any, idx: number) => {
        const calc = calculateLineItem({
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          lineDiscountType: item.lineDiscountType || null,
          lineDiscountValue: Number(item.lineDiscountValue) || null,
        });

        return {
          quoteId,
          productId: item.productId ? Number(item.productId) : null,
          displayName: item.displayName.trim(),
          selectedPlan: item.selectedPlan || null,
          priceBasis: item.priceBasis || null,
          unitPrice: Number(item.unitPrice) || 0,
          quantity: Number(item.quantity) || 1,
          lineDiscountType: item.lineDiscountType || null,
          lineDiscountValue: Number(item.lineDiscountValue) || null,
          lineTotal: calc.lineTotal,
          sortOrder: idx + 1,
        };
      });

      const quoteCalc = calculateQuote({
        items: processedClassicItems,
        generalDiscountType: data.generalDiscountType || null,
        generalDiscountValue: Number(data.generalDiscountValue) || null,
        vatRate: data.vatRate !== undefined ? Number(data.vatRate) : 20,
      });

      subtotal = quoteCalc.subtotal;
      netAfterDiscount = quoteCalc.netAfterDiscount;
      vatAmount = quoteCalc.vatAmount;
      totalAmount = quoteCalc.totalAmount;
    } else {
      if (!data.planComparisonItems || data.planComparisonItems.length === 0) {
        return NextResponse.json(
          { error: "En az bir ürün kalemi eklenmelidir." },
          { status: 400 }
        );
      }

      processedPlanItems = data.planComparisonItems.map((item: any, idx: number) => ({
        quoteId,
        productId: Number(item.productId),
        displayName: item.displayName.trim(),
        plan1FirstYear: Number(item.plan1FirstYear) || 0,
        plan1Renewal: Number(item.plan1Renewal) || 0,
        plan2FirstYear: Number(item.plan2FirstYear) || 0,
        plan2Renewal: Number(item.plan2Renewal) || 0,
        plan3FirstYear: Number(item.plan3FirstYear) || 0,
        plan3Renewal: Number(item.plan3Renewal) || 0,
        sortOrder: idx + 1,
      }));
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update quote fields (quoteNumber and quoteType never change)
      const q = await tx.quote.update({
        where: { id: quoteId },
        data: {
          quoteDate: data.quoteDate ? new Date(data.quoteDate) : existing.quoteDate,
          customerName: data.customerName.trim(),
          customerTaxOffice: data.customerTaxOffice?.trim() || null,
          customerTaxNumber: data.customerTaxNumber?.trim() || null,
          customerPhone: data.customerPhone?.trim() || null,
          customerEmail: data.customerEmail?.trim() || null,
          generalDiscountType: isClassic ? (data.generalDiscountType || null) : null,
          generalDiscountValue: isClassic ? (Number(data.generalDiscountValue) || null) : null,
          vatRate: isClassic ? (data.vatRate !== undefined ? Number(data.vatRate) : 20) : 20,
          subtotal,
          netAfterDiscount,
          vatAmount,
          totalAmount,
          notes: !isClassic ? (data.notes || null) : null,
          preparedByName: !isClassic ? (data.preparedByName || null) : null,
        },
      });

      // 2. Replace items
      if (isClassic) {
        await tx.quoteClassicItem.deleteMany({ where: { quoteId } });
        await tx.quoteClassicItem.createMany({ data: processedClassicItems });
      } else {
        await tx.quotePlanComparisonItem.deleteMany({ where: { quoteId } });
        await tx.quotePlanComparisonItem.createMany({ data: processedPlanItems });
      }

      return q;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Quote PUT error:", error);
    return NextResponse.json(
      { error: "Teklif güncellenirken hata oluştu." },
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
  const quoteId = parseInt(id, 10);

  if (isNaN(quoteId)) {
    return NextResponse.json({ error: "Geçersiz teklif ID" }, { status: 400 });
  }

  try {
    await prisma.quote.delete({
      where: { id: quoteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Quote DELETE error:", error);
    return NextResponse.json(
      { error: "Teklif silinirken hata oluştu." },
      { status: 500 }
    );
  }
}
