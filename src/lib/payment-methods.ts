export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "CREDIT_CARD",
  "CHECK",
  "OTHER",
] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

/** Makbuz üzerinde görünen ödeme şekli adları. */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: "Nakit",
  BANK_TRANSFER: "Havale / EFT",
  CREDIT_CARD: "Kredi Kartı",
  CHECK: "Çek",
  OTHER: "Diğer",
};

/** Makbuz cümlesinde kullanılan küçük harfli biçimler. */
export const PAYMENT_METHOD_SENTENCE: Record<string, string> = {
  CASH: "nakit",
  BANK_TRANSFER: "havale/EFT",
  CREDIT_CARD: "kredi kartı",
  CHECK: "çek",
  OTHER: "diğer",
};

export function isPaymentMethod(value: unknown): value is PaymentMethodValue {
  return (
    typeof value === "string" &&
    (PAYMENT_METHODS as readonly string[]).includes(value)
  );
}

export function paymentMethodLabel(value: string | null | undefined): string {
  if (!value) return "-";
  return PAYMENT_METHOD_LABELS[value] ?? value;
}
