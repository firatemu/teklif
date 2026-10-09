"use client";

import { useState, useEffect, useCallback, useDeferredValue } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  FileText, Layers, Plus, Search, Eye, Edit, Copy,
  Download, Trash2, SlidersHorizontal, X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { EmptyState, TableSkeleton } from "@/components/ui/States";

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
  const notify = useToast();

  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<QuoteItem | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const deferredSearch = useDeferredValue(search);

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      const res = await fetch(`/api/quotes?${params.toString()}`);
      if (res.ok) setQuotes(await res.json());
      else notify.error("Teklifler alınamadı");
    } catch {
      notify.error("Bağlantı hatası", "Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, notify]);

  useEffect(() => {
    fetchQuotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (deferredSearch !== search) fetchQuotes();
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch]);

  const handleDuplicate = async (q: QuoteItem) => {
    setBusyId(q.id);
    try {
      const res = await fetch(`/api/quotes/${q.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        notify.error("Çoğaltılamadı", data.error || "Bilinmeyen bir hata oluştu.");
        return;
      }
      notify.success("Teklif çoğaltıldı", q.quoteNumber + " kopyalandi.");
      router.push(`/quotes/${data.id}`);
      router.refresh();
    } catch {
      notify.error("Bağlantı hatasi", "Teklif cogaltilamadi.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const q = pendingDelete;
    setBusyId(q.id);
    try {
      const res = await fetch(`/api/quotes/${q.id}`, { method: "DELETE" });
      if (!res.ok) {
        notify.error("Silinemedi", "Teklif silinirken bir hata olustu.");
        return;
      }
      notify.success("Teklif silindi", q.quoteNumber + " kalici olarak kaldirildi.");
      setPendingDelete(null);
      fetchQuotes();
    } catch {
      notify.error("Bağlantı hatasi", "Teklif silinemedi.");
    } finally {
      setBusyId(null);
    }
  };

  const hasFilters = Boolean(search) || typeFilter !== "ALL";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileText className="h-6 w-6 text-brand-600" />
            Teklifler
          </h1>
          <p className="page-subtitle">
            Oluşturulan tüm klasik ve plan karsilastirmali teklifleri yonetirsiniz
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/quotes/classic/new" className="btn btn-secondary">
            <Plus className="h-4 w-4" />
            Klasik
          </Link>
          <button
            type="button"
            onClick={() => setIsTypeModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus className="h-4 w-4" />
            Yeni Teklif Olustur
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchQuotes();
          }}
          className="relative w-full sm:max-w-sm"
        >
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="search"
            placeholder="Musteri adi veya teklif no ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pl-9 pr-9"
            aria-label="Teklif ara"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                fetchQuotes();
              }}
              aria-label="Aramayi temizle"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        <div className="flex items-center gap-2.5">
          <SlidersHorizontal className="hidden h-4 w-4 text-slate-400 sm:block" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Teklif turu filtresi"
            className="field w-full sm:w-auto"
          >
            <option value="ALL">Tum Teklifler</option>
            <option value="CLASSIC">Klasik</option>
            <option value="PLAN_COMPARISON">Plan Karsilastirmali</option>
          </select>
        </div>
      </div>

      {!loading && (
        <p className="mt-4 text-sm text-slate-500">
          <span className="font-semibold text-slate-700 tabular">{quotes.length}</span> teklif
          {hasFilters && <span className="text-slate-400"> (filtreli)</span>}
        </p>
      )}

      <div className="surface mt-3 overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : quotes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={hasFilters ? "Sonuc bulunamadi" : "Henuz teklif yok"}
            description={
              hasFilters
                ? "Arama kriterlerinizi degistirerek tekrar deneyin."
                : "Ilk teklifinizi olusturarak baslayin."
            }
            action={
              hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setTypeFilter("ALL");
                  }}
                  className="btn btn-secondary"
                >
                  Filtreleri Temizle
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(true)}
                  className="btn btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Teklif Olustur
                </button>
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="table-head">
                <tr>
                  <th scope="col">Teklif No</th>
                  <th scope="col">Tur</th>
                  <th scope="col">Musteri / Firma</th>
                  <th scope="col">Teklif Tarihi</th>
                  <th scope="col" className="text-right">Tutar</th>
                  <th scope="col" className="text-right">Islemler</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {quotes.map((q) => {
                  const isClassic = q.quoteType === "CLASSIC";
                  const editUrl = isClassic
                    ? `/quotes/classic/${q.id}/edit`
                    : `/quotes/plan-comparison/${q.id}/edit`;
                  return (
                    <tr key={q.id}>
                      <td>
                        <Link
                          href={`/quotes/${q.id}`}
                          className="font-semibold text-brand-700 transition-colors hover:text-brand-800 hover:underline"
                        >
                          {q.quoteNumber}
                        </Link>
                      </td>
                      <td>
                        <span className={`badge ${isClassic ? "badge-brand" : "badge-accent"}`}>
                          {isClassic ? "Klasik" : "Plan Karsilastirmali"}
                        </span>
                      </td>
                      <td className="font-medium text-slate-900">{q.customerName}</td>
                      <td className="text-slate-500 tabular">{formatDate(q.quoteDate)}</td>
                      <td className="text-right font-semibold text-slate-900 tabular">
                        {isClassic ? formatCurrency(q.totalAmount) : "-"}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-0.5">
                          <Link
                            href={`/quotes/${q.id}`}
                            className="icon-btn"
                            title="Incele"
                            aria-label={q.quoteNumber + " incele"}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={editUrl}
                            className="icon-btn"
                            title="Duzenle"
                            aria-label={q.quoteNumber + " duzenle"}
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => window.open(`/api/quotes/${q.id}/pdf`, "_blank")}
                            className="icon-btn"
                            title="PDF indir"
                            aria-label={q.quoteNumber + " PDF indir"}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicate(q)}
                            disabled={busyId === q.id}
                            className="icon-btn"
                            title="Cogalt"
                            aria-label={q.quoteNumber + " cogalt"}
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDelete(q)}
                            disabled={busyId === q.id}
                            className="icon-btn icon-btn-danger"
                            title="Sil"
                            aria-label={q.quoteNumber + " sil"}
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

      <Modal
        open={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        title="Teklif Turu Secin"
        description="Olusturmak istediginiz teklif formatini belirleyin."
        size="md"
        footer={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsTypeModalOpen(false)}
          >
            Kapat
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/quotes/classic/new"
            onClick={() => setIsTypeModalOpen(false)}
            className="group flex flex-col rounded-xl border border-slate-200 p-5 transition-all hover:border-brand-500 hover:bg-brand-50/40 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-100 text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
              <FileText className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-[15px] font-bold text-slate-900">Klasik Teklif</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              Satir bazli miktar, birim fiyat, satir ve genel iskonto ile KDV dokumu iceren
              standart teklif formati.
            </p>
            <span className="mt-3 text-xs font-semibold text-brand-700 opacity-0 transition-opacity group-hover:opacity-100">
              Bu formati secin &rarr;
            </span>
          </Link>

          <Link
            href="/quotes/plan-comparison/new"
            onClick={() => setIsTypeModalOpen(false)}
            className="group flex flex-col rounded-xl border border-slate-200 p-5 transition-all hover:border-accent-500 hover:bg-warn-50/40 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-warn-100 text-warn-700 transition-colors group-hover:bg-accent-500 group-hover:text-white">
              <Layers className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-[15px] font-bold text-slate-900">Plan Karsilastirmali</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              Plan 1, 2 ve 3 alternatiflerinin ilk yil ve yenileme fiyatlarini yan yana
              sunan karsilastirma tablosu.
            </p>
            <span className="mt-3 text-xs font-semibold text-warn-700 opacity-0 transition-opacity group-hover:opacity-100">
              Bu formati secin &rarr;
            </span>
          </Link>
        </div>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Teklifi sil"
        description={
          pendingDelete
            ? pendingDelete.quoteNumber +
              " numarali teklif ve tum kalemleri kalici olarak silinecek."
            : undefined
        }
        confirmLabel="Sil"
      />
    </div>
  );
}
