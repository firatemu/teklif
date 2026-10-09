import { Loader2 } from "lucide-react";

/** Full-page loading state with a refined spinner. */
export function PageLoader({ label = "Yükleniyor" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

/** Placeholder rows shown while a table loads. */
export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-3.5 rounded bg-slate-100"
              style={{
                width: `${[18, 30, 14, 16, 12][c % 5]}%`,
                opacity: 1 - r * 0.08,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Empty state with icon, headline and optional action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Inline alert banner. */
export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "danger" | "warn";
  title?: string;
  children: React.ReactNode;
}) {
  const map = {
    info: "border-brand-100 bg-brand-50 text-brand-800",
    success: "border-success-100 bg-success-50 text-success-700",
    danger: "border-danger-100 bg-danger-50 text-danger-700",
    warn: "border-warn-100 bg-warn-50 text-warn-700",
  } as const;

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${map[tone]}`} role="alert">
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-0.5 leading-relaxed opacity-90" : "leading-relaxed"}>{children}</div>
    </div>
  );
}