"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X, XCircle } from "lucide-react";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (tone: ToastTone, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, { icon: typeof Info; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: "border-success-100 bg-success-50", iconColor: "text-success-600" },
  error: { icon: XCircle, ring: "border-danger-100 bg-danger-50", iconColor: "text-danger-600" },
  info: { icon: Info, ring: "border-brand-100 bg-brand-50", iconColor: "text-brand-600" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (tone: ToastTone, title: string, description?: string) => {
      const id = ++seq.current;
      setToasts((prev) => [...prev.slice(-3), { id, tone, title, description }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 7000 : 4500);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (t, d) => toast("success", t, d),
      error: (t, d) => toast("error", t, d),
      info: (t, d) => toast("info", t, d),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-4 right-4 z-[70] flex w-full max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => {
          const s = toneStyles[t.tone];
          const Icon = s.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg ${s.ring}`}
              style={{ animation: "modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${s.iconColor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Bildirimi kapat"
                className="-m-1 shrink-0 rounded p-1 text-slate-400 transition-colors hover:bg-white/60 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Safe fallback so components work without a provider during SSR/tests
    return {
      toast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
    };
  }
  return ctx;
}