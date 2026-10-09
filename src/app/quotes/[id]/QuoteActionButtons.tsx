"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Edit, Copy, Trash2 } from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

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
  const notify = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const editPath =
    quoteType === "CLASSIC"
      ? `/quotes/classic/${quoteId}/edit`
      : `/quotes/plan-comparison/${quoteId}/edit`;

  const handleDuplicate = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        notify.error("Cogaltilamadi", data.error || "Bilinmeyen bir hata olustu.");
        return;
      }
      notify.success("Teklif cogaltildi", quoteNumber + " kopyalandi.");
      router.push(`/quotes/${data.id}`);
      router.refresh();
    } catch {
      notify.error("Baglanti hatasi", "Teklif cogaltilamadi.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
      if (!res.ok) {
        notify.error("Silinemedi", "Teklif silinirken bir hata olustu.");
        return;
      }
      notify.success("Teklif silindi", quoteNumber + " kaldirildi.");
      setConfirmOpen(false);
      router.push("/");
      router.refresh();
    } catch {
      notify.error("Baglanti hatasi", "Teklif silinemedi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="no-print flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => window.open(`/api/quotes/${quoteId}/pdf`, "_blank")}
          className="btn btn-primary"
        >
          <Download className="h-4 w-4" />
          PDF Indir
        </button>
        <Link href={editPath} className="btn btn-secondary">
          <Edit className="h-3.5 w-3.5" />
          Duzenle
        </Link>
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={busy}
          className="btn btn-secondary"
        >
          <Copy className="h-3.5 w-3.5" />
          Cogalt
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={busy}
          className="btn btn-danger-soft"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Sil
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Teklifi sil"
        description={
          quoteNumber + " numarali teklif ve tum kalemleri kalici olarak silinecek."
        }
        confirmLabel="Sil"
      />
    </>
  );
}
