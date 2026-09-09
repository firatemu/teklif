import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { calculateQuote, calculateLineItem } from "@/lib/calculations";
import { QuoteType } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const type = searchParams.get("type");

  try {
    const where: any = {};
    if (type === "CLASSIC" || type === "PLAN_COMPARISON") {
      where.quoteType = type;
    }
    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { quoteNumber: { contains: search } },
      ];
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        classicItems: true,
        planComparisonItems: true,
      },
      orderBy: { quoteDate: "desc" },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Quotes GET error:", error);
    return NextResponse.json(
      { error: "Teklifler alınırken hata oluştu." },
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

    if (!data.customerName || !data.customerName.trim()) {
      return NextResponse.json(
        { error: "Müşteri adı zorunludur." },
        { status: 400 }
      );
    }

    if (!data.quoteType || !["CLASSIC", "PLAN_COMPARISON"].includes(data.quoteType)) {
      return NextResponse.json(
        { error: "Geçersiz teklif türü." },
        { status: 400 }
      );
    }

    const isClassic = data.quoteType === "CLASSIC";

    if (isClassic) {
      if (!data.classicItems || data.classicItems.length === 0) {
        return NextResponse.json(
          { error: "En az bir teklif kalemi eklenmelidir." },
          { status: 400 }
        );
      }
    } else {
      if (!data.planComparisonItems || data.planComparisonItems.length === 0) {
        return NextResponse.json(
          { error: "En az bir ürün kalemi eklenmelidir." },
          { status: 400 }
        );
      }
    }

    // Calculations
    let subtotal = 0;
    let netAfterDiscount = 0;
    let vatAmount = 0;
    let totalAmount = 0;

    let processedClassicItems: any[] = [];
    let processedPlanItems: any[] = [];

    if (isClassic) {
      processedClassicItems = data.classicItems.map((item: any, idx: number) => {
        const calc = calculateLineItem({
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          lineDiscountType: item.lineDiscountType || null,
          lineDiscountValue: Number(item.lineDiscountValue) || null,
        });

        return {
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
      // Plan Comparison: zero totals on Quote record per Spec 6.3
      processedPlanItems = data.planComparisonItems.map((item: any, idx: number) => ({
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

    // Create quote inside transaction to auto-assign AZM-XXXX format
    const newQuote = await prisma.$transaction(async (tx) => {
      // 1. Create with placeholder quoteNumber
      const tempNumber = `TEMP-${Date.now()}`;
      const quote = await tx.quote.create({
        data: {
          quoteNumber: tempNumber,
          quoteType: data.quoteType as QuoteType,
          quoteDate: data.quoteDate ? new Date(data.quoteDate) : new Date(),
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

      // 2. Set permanent quoteNumber AZM-0001
      const quoteNumber = `AZM-${String(quote.id).padStart(4, "0")}`;
      const updatedQuote = await tx.quote.update({
        where: { id: quote.id },
        data: { quoteNumber },
      });

      // 3. Create items
      if (isClassic) {
        await tx.quoteClassicItem.createMany({
          data: processedClassicItems.map((it) => ({
            ...it,
            quoteId: quote.id,
          })),
        });
      } else {
        await tx.quotePlanComparisonItem.createMany({
          data: processedPlanItems.map((it) => ({
            ...it,
            quoteId: quote.id,
          })),
        });
      }

      return updatedQuote;
    });

    return NextResponse.json(newQuote, { status: 201 });
  } catch (error) {
    console.error("Quote POST error:", error);
    return NextResponse.json(
      { error: "Teklif kaydedilirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
