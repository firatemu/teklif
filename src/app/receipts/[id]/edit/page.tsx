import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ReceiptForm from "../../new/ReceiptForm";

export default async function EditReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const receiptId = parseInt(id, 10);
  if (isNaN(receiptId)) return notFound();

  const receipt = await prisma.paymentReceipt.findUnique({
    where: { id: receiptId },
  });

  if (!receipt) return notFound();

  return (
    <ReceiptForm
      initialReceipt={{
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        receiptDate: receipt.receiptDate.toISOString(),
        quoteId: receipt.quoteId,
        customerName: receipt.customerName,
        customerTaxOffice: receipt.customerTaxOffice,
        customerTaxNumber: receipt.customerTaxNumber,
        customerPhone: receipt.customerPhone,
        customerEmail: receipt.customerEmail,
        customerAddress: receipt.customerAddress,
        amount: receipt.amount,
        paymentMethod: receipt.paymentMethod,
        otherPaymentMethod: receipt.otherPaymentMethod,
        description: receipt.description,
        bankInfo: receipt.bankInfo,
        extraNotes: receipt.extraNotes,
        preparedByName: receipt.preparedByName,
      }}
    />
  );
}
