import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateQuotePdf } from "@/lib/pdf/generator";

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

    const pdfBuffer = await generateQuotePdf(quote);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${quote.quoteNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "PDF oluşturulurken bir hata meydana geldi." },
      { status: 500 }
    );
  }
}
