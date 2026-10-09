"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  BarChart3,
  FileText,
  Layers,
} from "lucide-react";

const FEATURES = [
  { icon: FileText, title: "Klasik Teklifler", text: "Satır bazlı fiyat, iskonto ve KDV dökümü" },
  { icon: Layers, title: "Plan Karşılaştırma", text: "Plan 1/2/3 alternatiflerini yan yana karşılaştırın" },
  { icon: BarChart3, title: "PDF Çıktısı", text: "Kurumsal formatta anında PDF üretimi" },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Giriş yapılamadı.");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Bağlantı hatası oluştu.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Brand panel — desktop only */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-900 p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-bold tracking-tight text-white ring-1 ring-white/20">
            AZ
          </span>
          <div className="leading-tight">
            <p className="text-base font-bold tracking-tight text-white">AzemTeklif</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-200">
              Logo Fiyat Portalı
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-[2.1rem] font-bold leading-[1.15] tracking-tight text-white">
            Te lif süreçlerinizi
            <br />
            <span className="text-brand-300">tek bir panelde</span> yönetin.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-brand-100/80">
            Fiyat kataloğunuz, teklifleriniz ve kurumsal PDF çıktılarınız — hepsi tek
            yerde, tutarlı ve hızlı.
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4.5 w-4.5 text-brand-200" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-[13px] leading-relaxed text-brand-100/70">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-brand-200/50">
          © Azem Yazılım · Tüm hakları saklıdır
        </p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <div className="lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold text-white shadow-sm">
              AZ
            </span>
          </div>

          <div className="mt-8 lg:mt-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tekrar hoş geldiniz</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Devam etmek için hesabınıza giriş yapın.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-lg border border-danger-100 bg-danger-50 px-3.5 py-3 text-sm text-danger-700"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="field-label">
                Kullanıcı Adı
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="field pl-9"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Şifre
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-slate-400" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="field pl-9"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Güvenli bağlantı üzerinden oturum yönetimi
          </p>
        </div>
      </div>
    </div>
  );
}