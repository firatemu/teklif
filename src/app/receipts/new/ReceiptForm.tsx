"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CreditCard,
  Download,
  FileText,
  Receipt,
  Save,
  Search,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { amountToTurkishWords } from "@/lib/turkish-words";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_SENTENCE } from "@/lib/payment-methods";
import { useToast } from "@/components/ui/Toast";

interface QuoteOption {
  id: number;
  quoteNumber: string;
  quoteType: "CLASSIC" | "PLAN_COMPARISON";
  customerName: string;
  totalAmount: number;
  quoteDate: string;
  customerTaxOffice?: string | null;
  customerTaxNumber?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  collectedAmount: number;
}

const METHOD_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  CASH: Wallet,
  BANK_TRANSFER: Building2,
  CREDIT_CARD: CreditCard,
  CHECK: FileText,
};

function todayInputValue(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
}

export default function ReceiptForm({
  initialQuoteId,
}: {
  initialQuoteId: number | null;
}) {
  const router = useRouter();
  const notify = useToast();

  const [quotes, setQuotes] = useState<QuoteOption[]>([]);
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteId, setQuoteId] = useState<number | null>(initialQuoteId);
  const [selectedQuote, setSelectedQuote] = useState<QuoteOption | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerTaxOffice, setCustomerTaxOffice] = useState("");
  const [customerTaxNumber, setCustomerTaxNumber] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CASH");
  const [receiptDate, setReceiptDate] = useState(todayInputValue());
  const [description, setDescription] = useState("");
  const [preparedByName, setPreparedByName] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [company, setCompany] = useState({
    name: "Azem Yazılım Bilişim ve Teknolojileri Ltd. Şti.",
    shortName: "Azem Yazılım",
    tagline: "",
    address: "",
    taxOffice: "",
    taxNumber: "",
    website: "",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setCompany({
          name: data.name || company.name,
          shortName: data.shortName || company.shortName,
          tagline: data.tagline || "",
          address: data.address || "",
          taxOffice: data.taxOffice || "",
          taxNumber: data.taxNumber || "",
          website: data.website || "",
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchQuotes = useCallback(async () => {
    try {
      setLoadingQuotes(true);
      const [quoteRes, receiptRes] = await Promise.all([
        fetch("/api/quotes"),
        fetch("/api/receipts"),
      ]);
      if (!quoteRes.ok) return;
      const data = await quoteRes.json();
      const receipts = receiptRes.ok ? await receiptRes.json() : [];
      const collected = new Map<number, number>();
      receipts.forEach((item: any) => {
        if (!item.quoteId) return;
        collected.set(
          item.quoteId,
          (collected.get(item.quoteId) || 0) + (item.amount || 0)
        );
      });
      setQuotes(
        data.map((q: any) => ({
          id: q.id,
          quoteNumber: q.quoteNumber,
          quoteType: q.quoteType,
          customerName: q.customerName,
          totalAmount: q.totalAmount || 0,
          quoteDate: q.quoteDate,
          customerTaxOffice: q.customerTaxOffice,
          customerTaxNumber: q.customerTaxNumber,
          customerPhone: q.customerPhone,
          customerEmail: q.customerEmail,
          collectedAmount: collected.get(q.id) || 0,
        }))
      );
    } catch {
      notify.error("Teklifler alınamadı");
    } finally {
      setLoadingQuotes(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Teklif seçimi: müşteri bilgilerini ve tutarı otomatik doldur
  const appliedQuoteId = useRef<number | null>(null);
  useEffect(() => {
    if (quoteId === appliedQuoteId.current) return;
    appliedQuoteId.current = quoteId;

    if (!quoteId) {
      setSelectedQuote(null);
      return;
    }
    const q = quotes.find((item) => item.id === quoteId);
    if (!q) return;
    setSelectedQuote(q);
    setCustomerName(q.customerName);
    setCustomerTaxOffice(q.customerTaxOffice || "");
    setCustomerTaxNumber(q.customerTaxNumber || "");
    setCustomerPhone(q.customerPhone || "");
    setCustomerEmail(q.customerEmail || "");
    const remaining = Math.max((q.totalAmount || 0) - (q.collectedAmount || 0), 0);
    setAmount(remaining > 0 ? String(remaining) : "");
  }, [quoteId, quotes]);

  const filteredQuotes = useMemo(() => {
    const term = quoteSearch.trim().toLowerCase();
    const list = term
      ? quotes.filter(
          (q) =>
            q.quoteNumber.toLowerCase().includes(term) ||
            q.customerName.toLowerCase().includes(term)
        )
      : quotes;
    return list.slice(0, 25);
  }, [quotes, quoteSearch]);

  const amountNumber = Number(amount) || 0;
  const amountInWords = amountNumber > 0 ? amountToTurkishWords(amountNumber) : "";
  const methodLabel = PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod;
  const methodSentence =
    PAYMENT_METHOD_SENTENCE[paymentMethod] ?? methodLabel.toLowerCase();

  const remaining = selectedQuote
    ? Math.max((selectedQuote.totalAmount || 0) - (selectedQuote.collectedAmount || 0), 0)
    : 0;

  const handleSave = async (withPdf: boolean) => {
    if (!customerName.trim()) {
      notify.error("Müşteri / firma adı zorunludur");
      return;
    }
    if (!(amountNumber > 0)) {
      notify.error("Tutar sıfırdan büyük olmalıdır");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId,
          customerName,
          customerTaxOffice,
          customerTaxNumber,
          customerPhone,
          customerEmail,
          amount: amountNumber,
          paymentMethod,
          receiptDate,
          description,
          preparedByName,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        notify.error("Makbuz kaydedilemedi", data.error || "Bilinmeyen bir hata oluştu.");
        return;
      }

      notify.success("Makbuz kaydedildi", data.receiptNumber + " numaralı makbuz oluşturuldu.");
      if (withPdf) {
        window.open(`/api/receipts/${data.id}/pdf`, "_blank");
      }
      router.push("/receipts");
      router.refresh();
    } catch {
      notify.error("Bağlantı hatası", "Makbuz kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="no-print mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/receipts" aria-label="Makbuz listesine don" className="btn btn-secondary btn-sm shrink-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Makbuzlar</span>
          </Link>
          <div className="min-w-0">
            <h1 className="page-title">
              <Receipt className="h-6 w-6 text-brand-600" />
              Yeni Tahsilat Makbuzu
            </h1>
            <p className="page-subtitle">
              Mevcut bir tekliften tahsilat oluşturun veya serbest tutar ile makbuz düzenleyin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="btn btn-secondary"
          >
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="btn btn-primary"
          >
            <Download className="h-4 w-4" />
            Kaydet &amp; PDF İndir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
        {/* Form */}
        <div className="space-y-6">
          {/* Quote selection */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
              <FileText className="h-4 w-4 text-brand-600" />
              Teklif Seçimi
            </h2>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={quoteSearch}
                onChange={(e) => setQuoteSearch(e.target.value)}
                placeholder="Teklif no veya müşteri ara..."
                className="field pl-9"
              />
            </div>

            <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setQuoteId(null);
                  setSelectedQuote(null);
                }}
                className={`flex w-full items-center justify-between border-b border-slate-100 px-3.5 py-2.5 text-left text-sm transition-colors ${
                  quoteId === null ? "bg-brand-50 text-brand-800" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="font-medium">Serbest Tutar (teklif seçilmedi)</span>
                <span className="text-xs text-slate-400">—</span>
              </button>

              {loadingQuotes ? (
                <p className="px-3.5 py-4 text-sm text-slate-400">Teklifler yükleniyor...</p>
              ) : filteredQuotes.length === 0 ? (
                <p className="px-3.5 py-4 text-sm text-slate-400">Eşleşen teklif bulunamadı.</p>
              ) : (
                filteredQuotes.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setQuoteId(q.id)}
                    className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3.5 py-2.5 text-left text-sm transition-colors last:border-b-0 ${
                      quoteId === q.id ? "bg-brand-50" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="font-semibold text-brand-700">{q.quoteNumber}</span>
                      <span className="ml-2 text-slate-600">{q.customerName}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular text-slate-500">
                      {formatCurrency(q.totalAmount)}
                    </span>
                  </button>
                ))
              )}
            </div>

            {selectedQuote && (
              <div className="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Teklif Tutarı</p>
                  <p className="font-semibold tabular text-slate-900">{formatCurrency(selectedQuote.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Tahsil Edilen</p>
                  <p className="font-semibold tabular text-slate-900">{formatCurrency(selectedQuote.collectedAmount)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Kalan</p>
                  <p className="font-semibold tabular text-success-700">{formatCurrency(remaining)}</p>
                </div>
              </div>
            )}
          </section>

          {/* Receipt fields */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Building2 className="h-4 w-4 text-brand-600" />
              Makbuz Bilgileri
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block field-label">Tahsilat Alınan Firma *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Örn: ABC Teknoloji San. ve Tic. Ltd. Şti."
                  className="field"
                />
              </div>

              <div>
                <label className="block field-label">Vergi Dairesi</label>
                <input
                  type="text"
                  value={customerTaxOffice}
                  onChange={(e) => setCustomerTaxOffice(e.target.value)}
                  className="field"
                />
              </div>

              <div>
                <label className="block field-label">Vergi No</label>
                <input
                  type="text"
                  value={customerTaxNumber}
                  onChange={(e) => setCustomerTaxNumber(e.target.value)}
                  className="field"
                />
              </div>

              <div>
                <label className="block field-label">Telefon</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="field"
                />
              </div>

              <div>
                <label className="block field-label">E-Posta</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="field"
                />
              </div>

              <div>
                <label className="block field-label">Tutar (TL) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                  className="field tabular"
                />
                {amountInWords && (
                  <p className="mt-1.5 text-xs italic leading-relaxed text-slate-500">{amountInWords}</p>
                )}
              </div>

              <div>
                <label className="block field-label">Tahsilat Tarihi</label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="field"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block field-label">Ödeme Şekli</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PAYMENT_METHODS.map((method) => {
                    const Icon = METHOD_ICONS[method] ?? Wallet;
                    const active = paymentMethod === method;
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                          active
                            ? "border-brand-600 bg-brand-50 text-brand-800 shadow-xs"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {PAYMENT_METHOD_LABELS[method]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block field-label">Açıklama / Not</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Boş bırakılırsa standart tahsilat cümlesi kullanılır."
                  className="field resize-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block field-label">Tahsilatı Yapan</label>
                <input
                  type="text"
                  value={preparedByName}
                  onChange={(e) => setPreparedByName(e.target.value)}
                  placeholder="Örn: Azem Yılmaz (Satış Yöneticisi)"
                  className="field"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Live A5 preview */}
        <aside className="no-print xl:sticky xl:top-24 xl:self-start">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Receipt className="h-4 w-4 text-brand-600" />
              A5 Yatay Önizleme
            </h2>
            <span className="text-xs text-slate-400">210 × 148 mm</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
            {/* Header: logo + belge kimlik bandı */}
            <div className="flex items-start justify-between gap-4 border-b-2 border-brand-800 px-5 py-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 text-[15px] font-bold text-white">
                  {(company.shortName || company.name || "AZ").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold uppercase leading-tight text-slate-900">
                    {company.name}
                  </p>
                  {company.tagline && (
                    <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-brand-700">
                      {company.tagline}
                    </p>
                  )}
                  <p className="truncate text-[9px] text-slate-500">
                    {company.address ? `${company.address}` : ""}
                  </p>
                </div>
              </div>
              <div className="shrink-0 overflow-hidden rounded-md border border-slate-200">
                <p className="bg-brand-800 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white">
                  Tahsilat Makbuzu
                </p>
                <div className="px-3 py-1.5 text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Belge No</p>
                  <p className="text-[12px] font-black text-brand-800">
                    TS-…
                    <span className="ml-1 text-[9px] font-normal text-slate-400">(kayıtta atanır)</span>
                  </p>
                  <p className="mt-0.5 text-[9px] text-slate-500">
                    {receiptDate ? formatDate(new Date(receiptDate)) : "-"} • {methodLabel}
                  </p>
                </div>
              </div>
            </div>

            <table className="w-full text-left">
              <tbody>
                <tr>
                  <th className="w-[22%] border border-slate-200 bg-slate-50 px-2.5 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Tahsilatı Yapan
                  </th>
                  <td className="border border-slate-200 px-2.5 py-2 text-[11px] font-semibold text-slate-900">
                    Azem Yazılım Bilişim ve Teknolojileri Ltd. Şti.
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-200 bg-slate-50 px-2.5 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Tahsilat Alınan
                  </th>
                  <td className="border border-slate-200 px-2.5 py-2 text-[11px] font-semibold text-slate-900">
                    {customerName || "—"}
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-200 bg-slate-50 px-2.5 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Ödeme Şekli
                  </th>
                  <td className="border border-slate-200 px-2.5 py-2 text-[11px] font-semibold text-slate-900">
                    {methodLabel}
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-200 bg-slate-50 px-2.5 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Tutar
                  </th>
                  <td className="border border-slate-200 px-2.5 py-2 text-[12px] font-black tabular text-brand-800">
                    {formatCurrency(amountNumber)}
                  </td>
                </tr>
                <tr>
                  <th className="border border-slate-200 bg-slate-50 px-2.5 py-2 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                    Yazıyla
                  </th>
                  <td className="border border-slate-200 px-2.5 py-2 text-[11px] font-semibold text-slate-900">
                    {amountInWords || "—"}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="mx-5 my-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] leading-relaxed text-slate-600">
              {description.trim() ||
                `Yukarıda belirtilen tutar ${methodSentence} ile tahsil edilmiş olup işbu makbuz düzenlenmiştir.`}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 px-5 py-3.5">
              <div className="rounded-lg border border-slate-200">
                <p className="border-b border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Tahsilatı Yapan
                  <span className="ml-1 float-right text-[8px] font-semibold text-slate-400">
                    Kaşe ve Paraf
                  </span>
                </p>
                <div className="px-2.5 py-2">
                  <p className="text-[10px] font-bold text-slate-900">{company.name}</p>
                  <div className="mt-1.5 flex items-end gap-2">
                    <div className="flex-1">
                      <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                        Paraf
                      </p>
                      <svg
                        width="122"
                        height="30"
                        viewBox="0 0 122 30"
                        className="block"
                        aria-hidden="true"
                      >
                        <path
                          d="M7 23 C 11 8, 20 5, 22 13 C 24 21, 15 26, 14 18 C 13 10, 23 7, 32 12 C 39 16, 36 23, 41 18 C 47 10, 57 7, 59 14 C 61 21, 51 25, 53 16 C 55 8, 67 7, 75 13 C 80 17, 77 23, 82 17 C 87 9, 97 9, 105 13 C 111 16, 113 20, 115 16"
                          fill="none"
                          stroke="#0f172a"
                          strokeWidth={1.6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity={0.9}
                        />
                        <path
                          d="M5 27 C 32 23, 64 24, 117 18"
                          fill="none"
                          stroke="#0f172a"
                          strokeWidth={1}
                          strokeLinecap="round"
                          opacity={0.55}
                        />
                        <path
                          d="M97 7 C 104 2, 112 3, 114 7"
                          fill="none"
                          stroke="#0f172a"
                          strokeWidth={1}
                          strokeLinecap="round"
                          opacity={0.4}
                        />
                      </svg>
                      <p className="mt-[-4px] text-[8px] font-bold text-slate-700">
                        {preparedByName || "-"}
                      </p>
                    </div>
                    <div className="w-1/3">
                      <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                        Tarih
                      </p>
                      <div className="h-[14px] border-b border-dashed border-slate-300" />
                    </div>
                  </div>
                  <div className="h-3" />
                  <p className="border-t border-dashed border-slate-300 pt-1 text-center text-[9px] text-slate-400">
                    Kaşe / İmza
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200">
                <p className="border-b border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                  Ödemeyi Yapan
                </p>
                <div className="px-2.5 py-2">
                  <p className="truncate text-[10px] font-bold text-slate-900">{customerName || "—"}</p>
                  <div className="h-6" />
                  <p className="border-t border-dashed border-slate-300 pt-1 text-center text-[9px] text-slate-400">
                    Kaşe / İmza
                  </p>
                </div>
              </div>
            </div>
          </div>

          {selectedQuote && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
              <CalendarDays className="h-3.5 w-3.5" />
              Bağlı teklif: <span className="font-semibold text-brand-700">{selectedQuote.quoteNumber}</span>
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
