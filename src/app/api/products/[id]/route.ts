import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { id } = await params;
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ error: "Geçersiz ürün ID" }, { status: 400 });
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Ürün bulunamadı" }, { status: 404 });
    }

    const data = await request.json();

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: data.name !== undefined ? data.name.trim() : existing.name,
        category: data.category !== undefined ? data.category.trim() : existing.category,
        subCategory: data.subCategory !== undefined ? (data.subCategory?.trim() || null) : existing.subCategory,
        plan1FirstYear: existing.productType === "PLAN_BASED" && data.plan1FirstYear !== undefined ? Number(data.plan1FirstYear) : existing.plan1FirstYear,
        plan1Renewal: existing.productType === "PLAN_BASED" && data.plan1Renewal !== undefined ? Number(data.plan1Renewal) : existing.plan1Renewal,
        plan2FirstYear: existing.productType === "PLAN_BASED" && data.plan2FirstYear !== undefined ? Number(data.plan2FirstYear) : existing.plan2FirstYear,
        plan2Renewal: existing.productType === "PLAN_BASED" && data.plan2Renewal !== undefined ? Number(data.plan2Renewal) : existing.plan2Renewal,
        plan3FirstYear: existing.productType === "PLAN_BASED" && data.plan3FirstYear !== undefined ? Number(data.plan3FirstYear) : existing.plan3FirstYear,
        plan3Renewal: existing.productType === "PLAN_BASED" && data.plan3Renewal !== undefined ? Number(data.plan3Renewal) : existing.plan3Renewal,
        fixedPrice: existing.productType === "FIXED" && data.fixedPrice !== undefined ? Number(data.fixedPrice) : existing.fixedPrice,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : existing.isActive,
        sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : existing.sortOrder,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Product PUT error:", error);
    return NextResponse.json(
      { error: "Ürün güncellenemedi." },
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
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return NextResponse.json({ error: "Geçersiz ürün ID" }, { status: 400 });
  }

  try {
    const classicCount = await prisma.quoteClassicItem.count({
      where: { productId },
    });
    const planCount = await prisma.quotePlanComparisonItem.count({
      where: { productId },
    });

    if (classicCount > 0 || planCount > 0) {
      return NextResponse.json(
        {
          error: "Bu ürün mevcut tekliflerde kullanıldığı için silinemez. Pasife alabilirsiniz.",
          inUse: true,
        },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json(
      { error: "Ürün silinirken bir hata oluştu." },
      { status: 500 }
    );
  }
}
