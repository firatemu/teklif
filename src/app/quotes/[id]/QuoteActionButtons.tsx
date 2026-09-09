"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Edit, Copy, Trash2, Printer } from "lucide-react";

interface QuoteActionButtonsProps {
  quoteId: number;
  quoteType: "CLASSIC" | "PLAN_COMPARISON";
  quoteNumber: string;
}

export default function QuoteActionButtons({
  quoteId,
  quoteType,
  quoteNumber,
}: QuoteActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const editPath =
    quoteType === "CLASSIC"
      ? `/quotes/classic/${quoteId}/edit`
      : `/quotes/plan-comparison/${quoteId}/edit`;

  const handleDuplicate = async () => {
    if (!confirm(`${quoteNumber} numaralı teklifi çoğaltmak istiyor musunuz?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Çoğaltılamadı");
        setLoading(false);
        return;
      }
      router.push(`/quotes/${data.id}`);
      router.refresh();
    } catch {
      alert("Hata oluştu");
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`${quoteNumber} numaralı teklifi kalıcı olarak silmek istediğinize emin misiniz?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Silinemedi");
        setLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      alert("Silinirken hata oluştu");
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/quotes/${quoteId}/pdf`, "_blank");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleDownloadPdf}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
      >
        <Download className="h-4 w-4" />
        PDF İndir
      </button>

      <Link
        href={editPath}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Edit className="h-3.5 w-3.5" />
        Düzenle
      </Link>

      <button
        type="button"
        onClick={handleDuplicate}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        <Copy className="h-3.5 w-3.5" />
        Çoğalt
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Sil
      </button>
    </div>
  );
}
