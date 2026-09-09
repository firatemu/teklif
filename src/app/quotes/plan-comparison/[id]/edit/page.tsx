import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import PlanComparisonQuoteForm from "../../PlanComparisonQuoteForm";

export default async function EditPlanComparisonQuotePage({
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
      planComparisonItems: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!quote || quote.quoteType !== "PLAN_COMPARISON") {
    return notFound();
  }

  return <PlanComparisonQuoteForm initialQuote={quote} />;
}
