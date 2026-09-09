"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  FileText,
  Layers,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Copy,
  Download,
  Trash2,
  Calendar,
  Building2,
  Sparkles,
} from "lucide-react";

interface QuoteItem {
  id: number;
  quoteNumber: string;
  quoteType: "CLASSIC" | "PLAN_COMPARISON";
  quoteDate: string;
  customerName: string;
  totalAmount: number;
  createdAt: string;
  classicItems: any[];
  planComparisonItems: any[];
}

export default function HomePage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "ALL") params.set("type", typeFilter);

      const res = await fetch(`/api/quotes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuotes();
  };

  const handleDuplicate = async (q: QuoteItem) => {
    if (!confirm(`${q.quoteNumber} teklifini kopyalamak istiyor musunuz?`)) return;

    try {
      const res = await fetch(`/api/quotes/${q.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        router.push(`/quotes/${data.id}`);
        router.refresh();
      } else {
        alert(data.error || "Kopyalanamadı.");
      }
    } catch {
      alert("Hata oluştu.");
    }
  };

  const handleDelete = async (q: QuoteItem) => {
    if (!confirm(`${q.quoteNumber} teklifini kalıcı olarak silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/quotes/${q.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchQuotes();
      } else {
        alert("Silinemedi.");
      }
    } catch {
      alert("Hata oluştu.");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-700" />
            <h1 className="text-2xl font-black text-slate-900">Kayıtlı Teklifler</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Oluşturulan tüm Klasik ve Plan Karşılaştırmalı teklifler
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsTypeModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Teklif Oluştur
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Müşteri adı veya teklif no ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" />
            Tür:
          </span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white py-1.5 px-3 text-xs font-medium text-slate-700 focus:border-blue-600"
          >
            <option value="ALL">Tüm Teklifler</option>
            <option value="CLASSIC">Klasik (Tür 1)</option>
            <option value="PLAN_COMPARISON">Plan Karşılaştırmalı (Tür 2)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Teklifler yükleniyor...</div>
        ) : quotes.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">Henüz kayıtlı teklif bulunmuyor.</p>
            <p className="text-xs text-slate-400 mt-1">
              Sağ üstteki "Yeni Teklif Oluştur" butonuna basarak ilk teklifinizi oluşturabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Teklif No</th>
                  <th className="px-3 py-3">Tür</th>
                  <th className="px-4 py-3">Müşteri / Firma Adı</th>
                  <th className="px-3 py-3">Teklif Tarihi</th>
                  <th className="px-3 py-3 text-right">Tutar</th>
                  <th className="px-4 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {quotes.map((q) => {
                  const isClassic = q.quoteType === "CLASSIC";
                  const editUrl = isClassic
                    ? `/quotes/classic/${q.id}/edit`
                    : `/quotes/plan-comparison/${q.id}/edit`;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-bold text-blue-700">
                        <Link href={`/quotes/${q.id}`} className="hover:underline">
                          {q.quoteNumber}
                        </Link>
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isClassic
                              ? "bg-blue-100 text-blue-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {isClassic ? "Klasik" : "Plan Karşılaştırmalı"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {q.customerName}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {formatDate(q.quoteDate)}
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-slate-900">
                        {isClassic ? formatCurrency(q.totalAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/quotes/${q.id}`}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700 transition-colors"
                            title="İncele"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={editUrl}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-700 transition-colors"
                            title="Düzenle"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => window.open(`/api/quotes/${q.id}/pdf`, "_blank")}
                            className="rounded p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                            title="PDF İndir"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(q)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                            title="Çoğalt"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(q)}
                            className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quote Type Selection Modal */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-black text-slate-900">Teklif Türü Seçiniz</h2>
            <p className="mt-1 text-xs text-slate-500">
              Oluşturmak istediğiniz teklif şablonu formatını belirleyin
            </p>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                href="/quotes/classic/new"
                onClick={() => setIsTypeModalOpen(false)}
                className="group flex flex-col rounded-xl border border-slate-200 p-4 hover:border-blue-600 hover:bg-blue-50/40 transition-all text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">Klasik Teklif (Tür 1)</h3>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                  Satır bazlı, miktar, birim fiyat, satır/genel iskontolar ve KDV dökümü içeren standart teklif.
                </p>
              </Link>

              <Link
                href="/quotes/plan-comparison/new"
                onClick={() => setIsTypeModalOpen(false)}
                className="group flex flex-col rounded-xl border border-slate-200 p-4 hover:border-purple-600 hover:bg-purple-50/40 transition-all text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Layers className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">Plan Karşılaştırmalı (Tür 2)</h3>
                <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
                  Plan 1, Plan 2 ve Plan 3 alternatiflerinin İlk Yıl ve Yenileme fiyatlarını yan yana sunan karşılaştırma tablosu.
                </p>
              </Link>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTypeModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
