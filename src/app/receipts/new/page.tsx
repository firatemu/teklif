import ReceiptForm from "./ReceiptForm";

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ quoteId?: string }>;
}) {
  const { quoteId } = await searchParams;
  const initialQuoteId = quoteId ? parseInt(quoteId, 10) : NaN;

  return <ReceiptForm initialQuoteId={isNaN(initialQuoteId) ? null : initialQuoteId} />;
}
