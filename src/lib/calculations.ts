import { DiscountType, PlanChoice, PriceBasis, Product } from "@prisma/client";

export interface LineItemCalculationInput {
  quantity: number;
  unitPrice: number;
  lineDiscountType?: DiscountType | null;
  lineDiscountValue?: number | null;
}

export interface LineItemCalculationResult {
  lineSubtotal: number;
  lineDiscountAmount: number;
  lineTotal: number;
}

export interface QuoteCalculationInput {
  items: LineItemCalculationInput[];
  generalDiscountType?: DiscountType | null;
  generalDiscountValue?: number | null;
  vatRate?: number;
}

export interface QuoteCalculationResult {
  subtotal: number;
  generalDiscountAmount: number;
  netAfterDiscount: number;
  vatAmount: number;
  totalAmount: number;
}

function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function calculateLineItem(input: LineItemCalculationInput): LineItemCalculationResult {
  const quantity = Number(input.quantity) || 0;
  const unitPrice = Number(input.unitPrice) || 0;
  const lineSubtotal = round2(quantity * unitPrice);

  let lineDiscountAmount = 0;
  const discountVal = Number(input.lineDiscountValue) || 0;

  if (input.lineDiscountType === "PERCENT") {
    lineDiscountAmount = round2(lineSubtotal * (discountVal / 100));
  } else if (input.lineDiscountType === "AMOUNT") {
    lineDiscountAmount = round2(discountVal);
  }

  if (lineDiscountAmount > lineSubtotal) {
    lineDiscountAmount = lineSubtotal;
  }

  const lineTotal = round2(lineSubtotal - lineDiscountAmount);

  return {
    lineSubtotal,
    lineDiscountAmount,
    lineTotal,
  };
}

export function calculateQuote(input: QuoteCalculationInput): QuoteCalculationResult {
  let subtotal = 0;
  for (const item of input.items) {
    const res = calculateLineItem(item);
    subtotal = round2(subtotal + res.lineTotal);
  }

  let generalDiscountAmount = 0;
  const genVal = Number(input.generalDiscountValue) || 0;

  if (input.generalDiscountType === "PERCENT") {
    generalDiscountAmount = round2(subtotal * (genVal / 100));
  } else if (input.generalDiscountType === "AMOUNT") {
    generalDiscountAmount = round2(genVal);
  }

  if (generalDiscountAmount > subtotal) {
    generalDiscountAmount = subtotal;
  }

  const netAfterDiscount = round2(subtotal - generalDiscountAmount);
  const vatRate = typeof input.vatRate === "number" ? input.vatRate : 20;
  const vatAmount = round2(netAfterDiscount * (vatRate / 100));
  const totalAmount = round2(netAfterDiscount + vatAmount);

  return {
    subtotal,
    generalDiscountAmount,
    netAfterDiscount,
    vatAmount,
    totalAmount,
  };
}

export function resolveClassicUnitPrice(
  product: Product,
  selectedPlan?: PlanChoice | null,
  priceBasis?: PriceBasis | null
): number {
  if (product.productType === "FIXED") {
    return product.fixedPrice ?? 0;
  }

  const plan = selectedPlan || "PLAN_1";
  const basis = priceBasis || "FIRST_YEAR";

  if (plan === "PLAN_1") {
    return (basis === "FIRST_YEAR" ? product.plan1FirstYear : product.plan1Renewal) ?? 0;
  } else if (plan === "PLAN_2") {
    return (basis === "FIRST_YEAR" ? product.plan2FirstYear : product.plan2Renewal) ?? 0;
  } else if (plan === "PLAN_3") {
    return (basis === "FIRST_YEAR" ? product.plan3FirstYear : product.plan3Renewal) ?? 0;
  }

  return 0;
}

export function formatPlanBasisLabel(plan: PlanChoice, basis: PriceBasis): string {
  const planMap: Record<PlanChoice, string> = {
    PLAN_1: "Plan 1",
    PLAN_2: "Plan 2",
    PLAN_3: "Plan 3",
  };
  const basisMap: Record<PriceBasis, string> = {
    FIRST_YEAR: "İlk Yıl",
    RENEWAL: "Yenileme",
  };
  return `${planMap[plan]} – ${basisMap[basis]}`;
}
