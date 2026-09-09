import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { companyConfig } from "@/config/company";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  FileText,
  Download,
  Edit,
  ArrowLeft,
  Copy,
  Trash2,
  Printer,
} from "lucide-react";
import QuoteActionButtons from "./QuoteActionButtons";

export default async function QuoteDetailPage({
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
      classicItems: { orderBy: { sortOrder: "asc" } },
      planComparisonItems: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!quote) return notFound();

  const isClassic = quote.quoteType === "CLASSIC";

  // If plan comparison, calculate column totals
  const p1FirstTotal = quote.planComparisonItems.reduce((acc, it) => acc + (it.plan1FirstYear || 0), 0);
  const p1RenTotal = quote.planComparisonItems.reduce((acc, it) => acc + (it.plan1Renewal || 0), 0);
  const p2FirstTotal = quote.planComparisonItems.reduce((acc, it) => acc + (it.plan2FirstYear || 0), 0);
  const p2RenTotal = quote.planComparisonItems.reduce((acc, it) => acc + (it.plan2Renewal || 0), 0);
  const p3FirstTotal = quote.planComparisonItems.reduce((acc, it) => acc + (it.plan3FirstYear || 0), 0);
  const p3RenTotal = quote.planComparisonItems.reduce((acc, it) => acc + (it.plan3Renewal || 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Action Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white p-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Teklifler
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-slate-900">{quote.quoteNumber}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  isClassic
                    ? "bg-blue-100 text-blue-800"
                    : "bg-purple-100 text-purple-800"
                }`}
              >
                {isClassic ? "Klasik Teklif" : "Plan Karşılaştırmalı"}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Düzenlenme: {formatDate(quote.quoteDate)}
            </div>
          </div>
        </div>

        {/* Action buttons (client component) */}
        <QuoteActionButtons quoteId={quote.id} quoteType={quote.quoteType} quoteNumber={quote.quoteNumber} />
      </div>

      {/* PDF Visual Container (Mimics exact A4 layout) */}
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white p-8 sm:p-12 shadow-md">
        {isClassic ? (
          /* CLASSIC VIEW */
          <div>
            {/* Header */}
            <div className="flex justify-between items-start pb-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 font-black text-xl text-white">
                  AZ
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    {companyConfig.name}
                  </h2>
                  <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                    {companyConfig.tagline}<br />
                    {companyConfig.address}<br />
                    Tel: {companyConfig.phone} | {companyConfig.email}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-black tracking-wider text-blue-700">
                  TEKLİF / PROFORMA
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Teklif No: <strong className="text-slate-900">{quote.quoteNumber}</strong>
                </div>
                <div className="text-xs text-slate-600">
                  Tarih: <strong className="text-slate-900">{formatDate(quote.quoteDate)}</strong>
                </div>
              </div>
            </div>

            {/* Recipient Box */}
            <div className="my-6 rounded-lg bg-slate-50 p-4 border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                İlgili Firmanın
              </div>
              <div className="text-sm font-bold text-slate-900">{quote.customerName}</div>
              <div className="text-xs text-slate-600 mt-1">
                {quote.customerTaxOffice || quote.customerTaxNumber ? (
                  <>Vergi Dairesi / No: {quote.customerTaxOffice || "—"} / {quote.customerTaxNumber || "—"}<br /></>
                ) : null}
                {quote.customerPhone ? <>Tel: {quote.customerPhone} </> : null}
                {quote.customerEmail ? <>| E-Posta: {quote.customerEmail}</> : null}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto my-6">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="bg-blue-700 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-2.5 text-center w-8">#</th>
                    <th className="p-2.5">Açıklama</th>
                    <th className="p-2.5 text-center w-20">Miktar</th>
                    <th className="p-2.5 text-right w-28">Birim Fiyat</th>
                    <th className="p-2.5 text-right w-24">İskonto</th>
                    <th className="p-2.5 text-right w-28">Tutar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quote.classicItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-semibold text-slate-900">{item.displayName}</td>
                      <td className="p-2.5 text-center">{item.quantity} Adet</td>
                      <td className="p-2.5 text-right">{formatCurrency(item.unitPrice)}</td>
                      <td className="p-2.5 text-right text-slate-500">
                        {item.lineDiscountValue
                          ? item.lineDiscountType === "PERCENT"
                            ? `%${item.lineDiscountValue}`
                            : formatCurrency(item.lineDiscountValue)
                          : "—"}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-500 max-w-sm">
                * Teklifimiz 15 gün süreyle geçerlidir.<br />
                * Fiyatlarımıza KDV dahil değildir.
              </div>

              <div className="w-full sm:w-72 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Ara Toplam:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(quote.subtotal)}</span>
                </div>
                {quote.generalDiscountValue && quote.generalDiscountValue > 0 ? (
                  <div className="flex justify-between text-red-600">
                    <span>
                      Genel İskonto ({quote.generalDiscountType === "PERCENT" ? `%${quote.generalDiscountValue}` : "Tutar"}):
                    </span>
                    <span className="font-semibold">
                      -{formatCurrency(quote.subtotal - quote.netAfterDiscount)}
                    </span>
                  </div>
                ) : null}
                <div className="flex justify-between text-slate-600">
                  <span>Net (KDV Hariç):</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(quote.netAfterDiscount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>KDV Tutarı (%{quote.vatRate}):</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(quote.vatAmount)}</span>
                </div>
                <div className="flex justify-between bg-blue-700 text-white font-extrabold text-sm p-3 rounded-lg shadow-xs mt-2">
                  <span>Ödenecek Toplam:</span>
                  <span>{formatCurrency(quote.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Thank you footer */}
            <div className="mt-12 text-center pt-6 border-t border-dashed border-slate-300">
              <div className="text-xs font-black tracking-widest text-blue-700">
                BİZİMLE ÇALIŞTIĞINIZ İÇİN TEŞEKKÜR EDERİZ!
              </div>
            </div>
          </div>
        ) : (
          /* PLAN COMPARISON VIEW */
          <div>
            {/* Header */}
            <div className="flex justify-between items-start pb-6 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-700 font-black text-lg text-white">
                  AZ
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    {companyConfig.name}
                  </h2>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {companyConfig.tagline}<br />
                    {quote.preparedByName ? <span><strong>Teklif Hazırlayan:</strong> {quote.preparedByName}<br /></span> : null}
                    Tel: {companyConfig.phone} | {companyConfig.email}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-black text-blue-700">
                  SAYIN {quote.customerName.toUpperCase()}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Teklif No: <strong className="text-slate-900">{quote.quoteNumber}</strong>
                </div>
                <div className="text-xs text-slate-600">
                  Tarih: <strong className="text-slate-900">{formatDate(quote.quoteDate)}</strong>
                </div>
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="overflow-x-auto my-6">
              <table className="min-w-full border-collapse text-left text-xs border border-slate-200">
                <thead>
                  <tr className="border-b border-slate-200 text-center">
                    <th rowSpan={2} className="p-2 text-left bg-slate-100 font-bold border-r border-slate-200 w-1/3">
                      Ürün / Çözüm Açıklaması
                    </th>
                    <th colSpan={2} className="p-1.5 bg-blue-100 text-blue-900 font-black border-r border-slate-200">
                      PLAN 1
                    </th>
                    <th colSpan={2} className="p-1.5 bg-amber-100 text-amber-950 font-black text-sm font-black border-r border-slate-200">
                      PLAN 2
                    </th>
                    <th colSpan={2} className="p-1.5 bg-emerald-100 text-emerald-900 font-black">
                      PLAN 3
                    </th>
                  </tr>
                  <tr className="border-b-2 border-slate-300 text-xs bg-slate-50 text-center">
                    <th className="p-1.5 font-bold text-blue-800 bg-blue-50/60">İlk Yıl</th>
                    <th className="p-1.5 font-bold text-blue-800 bg-blue-50/60 border-r border-slate-200">Yenileme</th>
                    <th className="p-1.5 font-bold text-amber-800 bg-amber-50/60">İlk Yıl</th>
                    <th className="p-1.5 font-bold text-amber-800 bg-amber-50/60 border-r border-slate-200">Yenileme</th>
                    <th className="p-1.5 font-bold text-emerald-800 bg-emerald-50/60">İlk Yıl</th>
                    <th className="p-1.5 font-bold text-emerald-800 bg-emerald-50/60">Yenileme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quote.planComparisonItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="p-2 font-semibold text-slate-900 border-r border-slate-200">
                        {item.displayName}
                      </td>
                      <td className="p-2 text-right bg-blue-50/40 font-bold text-slate-900">
                        {formatCurrency(item.plan1FirstYear)}
                      </td>
                      <td className="p-2 text-right bg-blue-50/40 border-r border-slate-200">
                        {formatCurrency(item.plan1Renewal)}
                      </td>
                      <td className="p-2 text-right bg-amber-50/40 font-bold text-slate-900">
                        {formatCurrency(item.plan2FirstYear)}
                      </td>
                      <td className="p-2 text-right bg-amber-50/40 border-r border-slate-200">
                        {formatCurrency(item.plan2Renewal)}
                      </td>
                      <td className="p-2 text-right bg-emerald-50/40 font-bold text-slate-900">
                        {formatCurrency(item.plan3FirstYear)}
                      </td>
                      <td className="p-2 text-right bg-emerald-50/40 font-bold text-slate-900">
                        {formatCurrency(item.plan3Renewal)}
                      </td>
                    </tr>
                  ))}

                  {/* Total Row */}
                  <tr className="font-black text-xs border-t-2 border-slate-300">
                    <td className="p-2.5 bg-slate-100 text-slate-900 border-r border-slate-200 uppercase">
                      TOPLAM
                    </td>
                    <td className="p-2.5 text-right text-blue-900 bg-blue-100/80">
                      {formatCurrency(p1FirstTotal)}
                    </td>
                    <td className="p-2.5 text-right text-blue-900 bg-blue-100/80 border-r border-slate-200">
                      {formatCurrency(p1RenTotal)}
                    </td>
                    <td className="p-2.5 text-right text-amber-950 bg-amber-100/90">
                      {formatCurrency(p2FirstTotal)}
                    </td>
                    <td className="p-2.5 text-right text-amber-950 bg-amber-100/90 border-r border-slate-200">
                      {formatCurrency(p2RenTotal)}
                    </td>
                    <td className="p-2.5 text-right text-emerald-900 bg-emerald-100/80">
                      {formatCurrency(p3FirstTotal)}
                    </td>
                    <td className="p-2.5 text-right text-emerald-900 bg-emerald-100/80">
                      {formatCurrency(p3RenTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Notes Section */}
            {quote.notes && (
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-200 my-6">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                  TEKLİF NOTLARI
                </div>
                <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600">
                  {quote.notes
                    .split("\n")
                    .map((n) => n.trim())
                    .filter(Boolean)
                    .map((line, idx) => (
                      <li key={idx}>{line}</li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
