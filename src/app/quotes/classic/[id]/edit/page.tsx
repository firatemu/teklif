import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ClassicQuoteForm from "../../ClassicQuoteForm";

export default async function EditClassicQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quoteId = parseInt(id, 10);
  if (isNaN(quoteId)) return notFound();

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      classicItems: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!quote || quote.quoteType !== "CLASSIC") {
    return notFound();
  }

  return <ClassicQuoteForm initialQuote={quote} />;
}
