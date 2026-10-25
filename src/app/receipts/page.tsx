"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  FileText,
  Plus,
  Receipt,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { paymentMethodLabel } from "@/lib/payment-methods";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { EmptyState, TableSkeleton } from "@/components/ui/States";

interface ReceiptItem {
  id: number;
  receiptNumber: string;
  receiptDate: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  description: string | null;
  quoteId: number | null;
  quote: {
    id: number;
    quoteNumber: string;
    totalAmount: number;
  } | null;
}

export default function ReceiptsPage() {
  const notify = useToast();

  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<ReceiptItem | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const fetchReceipts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/receipts");
      if (res.ok) setReceipts(await res.json());
      else notify.error("Makbuzlar alınamadı");
    } catch {
      notify.error("Bağlantı hatası", "Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return receipts;
    return receipts.filter(
      (r) =>
        r.receiptNumber.toLowerCase().includes(term) ||
        r.customerName.toLowerCase().includes(term) ||
        (r.quote?.quoteNumber || "").toLowerCase().includes(term)
    );
  }, [receipts, search]);

  const totals = useMemo(() => {
    const total = receipts.reduce((acc, r) => acc + (r.amount || 0), 0);
    const now = new Date();
    const monthTotal = receipts.reduce((acc, r) => {
      const d = new Date(r.receiptDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
        ? acc + (r.amount || 0)
        : acc;
    }, 0);
    return { total, monthTotal };
  }, [receipts]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    try {
      setBusyId(target.id);
      const res = await fetch(`/api/receipts/${target.id}`, { method: "DELETE" });
      if (!res.ok) {
        notify.error("Silinemedi", "Makbuz silinirken bir hata oluştu.");
        return;
      }
      notify.success("Makbuz silindi", target.receiptNumber + " kaldırıldı.");
      setPendingDelete(null);
      fetchReceipts();
    } catch {
      notify.error("Bağlantı hatası", "Makbuz silinemedi.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Receipt className="h-6 w-6 text-brand-600" />
            Tahsilat Makbuzları
          </h1>
          <p className="page-subtitle">
            Teklif bazlı veya serbest tutarlı tahsilat makbuzları — A5 yatay PDF çıktısı.
          </p>
        </div>
        <Link href="/receipts/new" className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Yeni Makbuz
        </Link>
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Toplam Makbuz
          </p>
          <p className="mt-1 text-xl font-bold tabular text-slate-900">{receipts.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Toplam Tahsilat
          </p>
          <p className="mt-1 text-xl font-bold tabular text-brand-800">
            {formatCurrency(totals.total)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Bu Ay
          </p>
          <p className="mt-1 text-xl font-bold tabular text-success-700">
            {formatCurrency(totals.monthTotal)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Makbuz no, müşteri veya teklif ara..."
            className="field pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={search ? "Eşleşen makbuz bulunamadı" : "Henüz makbuz oluşturulmadı"}
            description={
              search
                ? "Arama terimini değiştirmeyi deneyin."
                : "Teklif seçerek veya serbest tutar ile ilk tahsilat makbuzunuzu oluşturun."
            }
            action={
              !search ? (
                <Link href="/receipts/new" className="btn btn-primary">
                  <Plus className="h-4 w-4" />
                  Yeni Makbuz
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="table-head">
                <tr>
                  <th>Makbuz No</th>
                  <th>Tarih</th>
                  <th>Müşteri</th>
                  <th>Teklif</th>
                  <th>Ödeme Şekli</th>
                  <th className="text-right">Tutar</th>
                  <th className="text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap font-semibold text-brand-700">
                      {r.receiptNumber}
                    </td>
                    <td className="whitespace-nowrap tabular text-slate-600">
                      {formatDate(r.receiptDate)}
                    </td>
                    <td className="min-w-[180px] font-medium text-slate-900">
                      {r.customerName}
                    </td>
                    <td className="whitespace-nowrap">
                      {r.quote ? (
                        <Link
                          href={`/quotes/${r.quote.id}`}
                          className="text-brand-700 hover:underline"
                        >
                          {r.quote.quoteNumber}
                        </Link>
                      ) : (
                        <span className="text-slate-400">Serbest tutar</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <span className="badge badge-muted">
                        <Wallet className="h-3 w-3" />
                        {paymentMethodLabel(r.paymentMethod)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-right font-semibold tabular text-slate-900">
                      {formatCurrency(r.amount)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => window.open(`/api/receipts/${r.id}/pdf`, "_blank")}
                          className="icon-btn"
                          title="PDF indir"
                          aria-label={`${r.receiptNumber} PDF indir`}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(r)}
                          disabled={busyId === r.id}
                          className="icon-btn text-danger-600 hover:bg-danger-50"
                          title="Sil"
                          aria-label={`${r.receiptNumber} sil`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {receipts.length > 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
          <FileText className="h-3.5 w-3.5" />
          Makbuzlar A5 yatay (210 × 148 mm) formatında PDF olarak indirilir.
        </p>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Makbuzu sil"
        description={
          pendingDelete
            ? `${pendingDelete.receiptNumber} numaralı tahsilat makbuzu kalıcı olarak silinecek.`
            : ""
        }
        confirmLabel="Sil"
      />
    </div>
  );
}
