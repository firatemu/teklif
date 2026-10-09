import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { companyConfig } from "@/config/company";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { ArrowLeft, FileText, Printer, Layers } from "lucide-react";
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

  const p1FirstTotal = quote.planComparisonItems.reduce((a, i) => a + (i.plan1FirstYear || 0), 0);
  const p1RenTotal = quote.planComparisonItems.reduce((a, i) => a + (i.plan1Renewal || 0), 0);
  const p2FirstTotal = quote.planComparisonItems.reduce((a, i) => a + (i.plan2FirstYear || 0), 0);
  const p2RenTotal = quote.planComparisonItems.reduce((a, i) => a + (i.plan2Renewal || 0), 0);
  const p3FirstTotal = quote.planComparisonItems.reduce((a, i) => a + (i.plan3FirstYear || 0), 0);
  const p3RenTotal = quote.planComparisonItems.reduce((a, i) => a + (i.plan3Renewal || 0), 0);

  const notes = quote.notes
    ? quote.notes.split("\n").map((n) => n.trim()).filter(Boolean)
    : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="no-print mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Teklifler listesine don"
            className="btn btn-secondary btn-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Teklifler</span>
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                {quote.quoteNumber}
              </h1>
              <span className={`badge ${isClassic ? "badge-brand" : "badge-accent"}`}>
                {isClassic ? (
                  <FileText className="h-3 w-3" />
                ) : (
                  <Layers className="h-3 w-3" />
                )}
                {isClassic ? "Klasik" : "Plan Karsilastirmali"}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">
              {quote.customerName} &middot; {formatDate(quote.quoteDate)}
            </p>
          </div>
        </div>

        <QuoteActionButtons
          quoteId={quote.id}
          quoteType={quote.quoteType}
          quoteNumber={quote.quoteNumber}
        />
      </div>

      {/* Document preview */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
        {/* Document header */}
        <div className="flex flex-col gap-5 border-b border-slate-200 p-7 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white">
              AZ
            </span>
            <div className="min-w-0">
              <p className="text-[15px] font-bold leading-tight text-slate-900">
                {companyConfig.name}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {companyConfig.tagline}
                {quote.preparedByName && (
                  <>
                    <br />
                    Teklif Hazirlayan: <span className="font-medium text-slate-700">{quote.preparedByName}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-700">
              {isClassic ? "Teklif / Proforma" : "Plan Karsilastirmali Teklif"}
            </p>
            <dl className="mt-2 space-y-1 text-xs">
              <div className="flex gap-x-3 sm:justify-end">
                <dt className="text-slate-500">Teklif No:</dt>
                <dd className="font-semibold text-slate-900">{quote.quoteNumber}</dd>
              </div>
              <div className="flex gap-x-3 sm:justify-end">
                <dt className="text-slate-500">Tarih:</dt>
                <dd className="font-semibold text-slate-900 tabular">
                  {formatDate(quote.quoteDate)}
                </dd>
              </div>
              {quote.validUntil && (
                <div className="flex gap-x-3 sm:justify-end">
                  <dt className="text-slate-500">Gecerlilik:</dt>
                  <dd className="font-semibold text-slate-900 tabular">
                    {formatDate(quote.validUntil)}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Recipient */}
        <div className="mx-7 mt-6 rounded-lg border border-slate-200 border-l-[3px] border-l-brand-600 bg-slate-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-700">
            Teklif Sunulan Firma
          </p>
          <p className="mt-1 text-[15px] font-bold text-slate-900">{quote.customerName}</p>
          {(quote.customerTaxOffice || quote.customerTaxNumber || quote.customerPhone || quote.customerEmail) && (
            <p className="mt-1 text-xs text-slate-500">
              {quote.customerTaxOffice || quote.customerTaxNumber ? (
                <>
                  V.D.: {quote.customerTaxOffice || "-"} / {quote.customerTaxNumber || "-"}
                  {"  \u00b7  "}
                </>
              ) : null}
              {quote.customerPhone && <>Tel: {quote.customerPhone} {"  \u00b7  "}</>}
              {quote.customerEmail && <>E-posta: {quote.customerEmail}</>}
            </p>
          )}
        </div>

        {/* Body */}
        {isClassic ? (
          <div className="p-7">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="table-head">
                  <tr>
                    <th className="w-10 text-center">#</th>
                    <th>Aciklama</th>
                    <th className="w-24 text-center">Miktar</th>
                    <th className="w-32 text-right">Birim Fiyat</th>
                    <th className="w-24 text-right">Iskonto</th>
                    <th className="w-32 text-right">Tutar</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {quote.classicItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="text-center text-slate-400 tabular">{idx + 1}</td>
                      <td className="font-medium text-slate-900">{item.displayName}</td>
                      <td className="text-center tabular">{item.quantity} Adet</td>
                      <td className="text-right tabular">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right text-slate-500 tabular">
                        {item.lineDiscountValue
                          ? item.lineDiscountType === "PERCENT"
                            ? `%${item.lineDiscountValue}`
                            : formatCurrency(item.lineDiscountValue)
                          : "-"}
                      </td>
                      <td className="text-right font-semibold text-slate-900 tabular">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-7 grid gap-6 border-t border-slate-200 pt-6 lg:grid-cols-2">
              <div className="order-2 lg:order-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                  Teklif Notlari ve Kosullar
                </p>
                {notes.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-600">
                    {notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">-</p>
                )}
              </div>

              <div className="order-1 lg:order-2">
                <div className="overflow-hidden rounded-lg border border-slate-200">
                  <dl className="text-sm">
                    <div className="flex justify-between border-b border-slate-100 px-4 py-2.5">
                      <dt className="text-slate-500">Ara Toplam</dt>
                      <dd className="font-medium text-slate-900 tabular">
                        {formatCurrency(quote.subtotal)}
                      </dd>
                    </div>
                    {quote.generalDiscountValue && quote.generalDiscountValue > 0 ? (
                      <div className="flex justify-between border-b border-slate-100 px-4 py-2.5">
                        <dt className="text-slate-500">
                          Genel Iskonto (
                          {quote.generalDiscountType === "PERCENT"
                            ? `%${quote.generalDiscountValue}`
                            : "Tutar"}
                          )
                        </dt>
                        <dd className="font-medium text-danger-600 tabular">
                          -{formatCurrency(quote.subtotal - quote.netAfterDiscount)}
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between border-b border-slate-100 px-4 py-2.5">
                      <dt className="text-slate-500">Net (KDV Haric)</dt>
                      <dd className="font-medium text-slate-900 tabular">
                        {formatCurrency(quote.netAfterDiscount)}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 px-4 py-2.5">
                      <dt className="text-slate-500">KDV Tutari (%{quote.vatRate})</dt>
                      <dd className="font-medium text-slate-900 tabular">
                        {formatCurrency(quote.vatAmount)}
                      </dd>
                    </div>
                    <div className="flex justify-between bg-brand-50 px-4 py-3">
                      <dt className="text-[13px] font-bold uppercase tracking-wide text-brand-800">
                        Odenecek Toplam
                      </dt>
                      <dd className="text-base font-bold text-brand-800 tabular">
                        {formatCurrency(quote.totalAmount)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-7">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th
                      rowSpan={2}
                      className="w-[34%] border-b border-r border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-600"
                    >
                      Urun / Cozum Aciklamasi
                    </th>
                    <th
                      colSpan={2}
                      className="border-b border-l-2 border-brand-200 bg-brand-100 px-4 py-2 text-center text-[13px] font-bold text-brand-800"
                    >
                      PLAN 1
                    </th>
                    <th
                      colSpan={2}
                      className="border-b border-l-2 border-warn-200 bg-warn-100 px-4 py-2 text-center text-[13px] font-bold text-warn-700"
                    >
                      PLAN 2
                    </th>
                    <th
                      colSpan={2}
                      className="border-b border-l-2 border-success-200 bg-success-50 px-4 py-2 text-center text-[13px] font-bold text-success-700"
                    >
                      PLAN 3
                    </th>
                  </tr>
                  <tr className="border-b-2 border-slate-300">
                    {(
                      [
                        ["Ilk Yil", "bg-brand-50 text-brand-700", "border-l-2 border-brand-200"],
                        ["Yenileme", "bg-brand-50 text-brand-700", ""],
                        ["Ilk Yil", "bg-warn-50 text-warn-700", "border-l-2 border-warn-200"],
                        ["Yenileme", "bg-warn-50 text-warn-700", ""],
                        ["Ilk Yil", "bg-success-50 text-success-700", "border-l-2 border-success-200"],
                        ["Yenileme", "bg-success-50 text-success-700", ""],
                      ] as const
                    ).map(([label, tone, brd], i) => (
                      <th
                        key={i}
                        className={`px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide ${tone} ${brd}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {quote.planComparisonItems.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="border-r border-slate-200 px-4 py-3 text-[13px] font-medium text-slate-900">
                        {item.displayName}
                      </td>
                      <td className="bg-brand-50/50 px-3 py-3 text-right font-semibold text-slate-900 tabular">
                        {formatCurrency(item.plan1FirstYear)}
                      </td>
                      <td className="bg-brand-50/50 px-3 py-3 text-right text-slate-600 tabular">
                        {formatCurrency(item.plan1Renewal)}
                      </td>
                      <td className="border-l-2 border-warn-200 bg-warn-50/50 px-3 py-3 text-right font-semibold text-slate-900 tabular">
                        {formatCurrency(item.plan2FirstYear)}
                      </td>
                      <td className="bg-warn-50/50 px-3 py-3 text-right text-slate-600 tabular">
                        {formatCurrency(item.plan2Renewal)}
                      </td>
                      <td className="border-l-2 border-success-200 bg-success-50/50 px-3 py-3 text-right font-semibold text-slate-900 tabular">
                        {formatCurrency(item.plan3FirstYear)}
                      </td>
                      <td className="bg-success-50/50 px-3 py-3 text-right text-slate-600 tabular">
                        {formatCurrency(item.plan3Renewal)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-slate-300 bg-slate-50">
                    <td className="border-r border-slate-200 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Toplam
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-brand-800 tabular">
                      {formatCurrency(p1FirstTotal)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-brand-700 tabular">
                      {formatCurrency(p1RenTotal)}
                    </td>
                    <td className="border-l-2 border-warn-200 px-3 py-3 text-right font-bold text-warn-700 tabular">
                      {formatCurrency(p2FirstTotal)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-warn-700 tabular">
                      {formatCurrency(p2RenTotal)}
                    </td>
                    <td className="border-l-2 border-success-200 px-3 py-3 text-right font-bold text-success-700 tabular">
                      {formatCurrency(p3FirstTotal)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-success-700 tabular">
                      {formatCurrency(p3RenTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-lg border border-slate-200 border-l-[3px] border-l-brand-600 bg-slate-50 px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Teklif Notlari ve Ticari Kosullar
              </p>
              {notes.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-600">
                  {notes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-400">-</p>
              )}
            </div>
          </div>
        )}

        {/* Document footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-7 py-5 text-center">
          <p className="text-[13px] font-bold tracking-tight text-brand-700">
            Bizi tercih ettiginiz icin tesekkur ederiz.
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Bu belge AzemTeklif sistemi tarafindan olusturulmustur.
          </p>
        </div>
      </div>
    </div>
  );
}
