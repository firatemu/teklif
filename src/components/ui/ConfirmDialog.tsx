"use client";

import { useState, useCallback } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import Modal from "./Modal";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "brand";
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  /** Optional noun used in the default description, e.g. "AZM-0235 teklifi". */
  subject?: string;
}

/** Replaces window.confirm with an accessible, on-brand dialog. */
export default function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  subject,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  tone = "danger",
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = useCallback(async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }, [onConfirm]);

  const isDanger = tone === "danger";

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      title={title}
      size="sm"
      dismissible={!busy}
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? "btn-danger" : "btn-primary"}`}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? "İşleniyor..." : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            isDanger ? "bg-danger-50 text-danger-600" : "bg-brand-50 text-brand-600"
          }`}
        >
          {isDanger ? (
            <Trash2 className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-sm leading-relaxed text-slate-600">
            {description ?? (subject ? `"${subject}" işlemine devam edilsin mi?` : null)}
          </p>
          {isDanger && (
            <p className="mt-3 rounded-lg bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700">
              Bu işlem geri alınamaz.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}