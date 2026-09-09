import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ProductType } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get("activeOnly") === "true";
  const search = searchParams.get("search")?.toLowerCase() || "";

  try {
    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
        { subCategory: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { subCategory: "asc" },
        { sortOrder: "asc" },
      ],
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json(
      { error: "Ürünler getirilemedi." },
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

    if (!data.name || !data.category || !data.productType) {
      return NextResponse.json(
        { error: "Ürün adı, kategori ve ürün tipi zorunludur." },
        { status: 400 }
      );
    }

    const newProduct = await prisma.product.create({
      data: {
        name: data.name.trim(),
        category: data.category.trim(),
        subCategory: data.subCategory?.trim() || null,
        productType: data.productType as ProductType,
        plan1FirstYear: data.productType === "PLAN_BASED" ? Number(data.plan1FirstYear) || 0 : null,
        plan1Renewal: data.productType === "PLAN_BASED" ? Number(data.plan1Renewal) || 0 : null,
        plan2FirstYear: data.productType === "PLAN_BASED" ? Number(data.plan2FirstYear) || 0 : null,
        plan2Renewal: data.productType === "PLAN_BASED" ? Number(data.plan2Renewal) || 0 : null,
        plan3FirstYear: data.productType === "PLAN_BASED" ? Number(data.plan3FirstYear) || 0 : null,
        plan3Renewal: data.productType === "PLAN_BASED" ? Number(data.plan3Renewal) || 0 : null,
        fixedPrice: data.productType === "FIXED" ? Number(data.fixedPrice) || 0 : null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
        sortOrder: Number(data.sortOrder) || 999,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error("Product POST error:", error);
    return NextResponse.json(
      { error: "Ürün kaydedilemedi." },
      { status: 500 }
    );
  }
}
