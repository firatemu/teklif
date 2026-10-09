"use client";

import { useState, useEffect, useRef } from "react";
import {
  Save, Upload, Trash2, Building2, Phone, Mail,
  Globe, MapPin, FileText, ImageIcon, ShieldCheck,
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { PageLoader, Alert } from "@/components/ui/States";

interface CompanySettingsData {
  id: number;
  name: string;
  shortName: string;
  tagline: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  phone: string;
  phone2: string;
  email: string;
  website: string;
  city: string;
  hasLogo: boolean;
}

export default function SettingsPage() {
  const notify = useToast();
  const [settings, setSettings] = useState<CompanySettingsData | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingLogoDelete, setPendingLogoDelete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
    loadLogo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) setSettings(await res.json());
      else notify.error("Ayarlar yuklenemedi");
    } catch {
      notify.error("Baglanti hatasi", "Ayarlar yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }

  async function loadLogo() {
    try {
      const res = await fetch("/api/settings/logo");
      if (res.ok) {
        const data = await res.json();
        if (data.hasLogo) setLogoUrl(data.logoDataUrl);
      }
    } catch {
      /* logo load failure is non-blocking */
    }
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        notify.success("Firma bilgileri kaydedildi", "Degisiklikler bir sonraki PDF'te yansiyacak.");
      } else {
        const err = await res.json();
        notify.error("Kaydedilemedi", err.error || "Bir hata olustu.");
      }
    } catch {
      notify.error("Baglanti hatasi", "Ayarlar kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/settings/logo", { method: "POST", body: fd });
      if (res.ok) {
        notify.success("Logo yuklendi", file.name);
        loadLogo();
      } else {
        const err = await res.json();
        notify.error("Logo yuklenemedi", err.error || "Gorsel yuklenemedi.");
      }
    } catch {
      notify.error("Baglanti hatasi", "Logo yuklenemedi.");
    } finally {
      setUploading(false);
    }
  }

  async function handleLogoDelete() {
    try {
      const res = await fetch("/api/settings/logo", { method: "DELETE" });
      if (res.ok) {
        setLogoUrl(null);
        setPendingLogoDelete(false);
        notify.success("Logo silindi");
      }
    } catch {
      notify.error("Baglanti hatasi", "Logo silinemedi.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleLogoUpload(file);
  }

  function updateField(field: keyof CompanySettingsData, value: string) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  }

  if (loading) return <PageLoader label="Ayarlar yukleniyor" />;

  if (!settings) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Alert tone="danger" title="Ayarlar yuklenemedi">
          Sayfayi yenilemeyi deneyin.
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Building2 className="h-6 w-6 text-brand-600" />
            Firma Ayarlari
          </h1>
          <p className="page-subtitle">
            Bu bilgiler teklif PDF'lerinde kullanilir
          </p>
        </div>
      </div>

      {/* Logo */}
      <section className="surface mt-6 p-6">
        <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-slate-900">
          <ImageIcon className="h-5 w-5 text-brand-600" />
          Firma Logosu
        </h2>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-2">
            {logoUrl ? (
              <div className="group relative">
                <img
                  src={logoUrl}
                  alt="Firma logosu"
                  className="h-28 w-28 rounded-xl border border-slate-200 bg-white p-2 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setPendingLogoDelete(true)}
                  aria-label="Logoyu sil"
                  className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-danger-600 text-white opacity-0 shadow-md transition-opacity hover:bg-danger-700 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
            )}
            {logoUrl && (
              <button
                type="button"
                onClick={() => setPendingLogoDelete(true)}
                className="text-xs font-semibold text-danger-600 hover:underline"
              >
                Logoyu kaldir
              </button>
            )}
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
            }}
            className="flex flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40"
          >
            <Upload className="mb-2 h-7 w-7 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">
              {uploading ? "Yukleniyor..." : "Logo yuklemek icin tiklayin veya surukleyin"}
            </p>
            <p className="mt-1 text-xs text-slate-500">PNG, JPG veya WebP - Maks. 2MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
              }}
              className="hidden"
            />
          </div>
        </div>
      </section>

      {/* Company info */}
      <section className="surface mt-5 p-6">
        <h2 className="mb-6 flex items-center gap-2 text-base font-bold text-slate-900">
          <FileText className="h-5 w-5 text-brand-600" />
          Firma Bilgileri
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="field-label">Firma Adi</label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="field"
              placeholder="Firma Adiniz Ltd. Sti."
            />
          </div>
          <div>
            <label className="field-label">Kisa Ad</label>
            <input
              type="text"
              value={settings.shortName}
              onChange={(e) => updateField("shortName", e.target.value)}
              className="field"
              placeholder="Firma Kisa Adi"
            />
          </div>
          <div>
            <label className="field-label">Slogan / Unvan</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
              className="field"
              placeholder="Yetkili Is Ortagi"
            />
          </div>
          <div className="md:col-span-2">
            <label className="field-label">
              <MapPin className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
              Adres
            </label>
            <textarea
              value={settings.address}
              onChange={(e) => updateField("address", e.target.value)}
              rows={2}
              className="field resize-none"
              placeholder="Tam adres"
            />
          </div>
          <div>
            <label className="field-label">Sehir</label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="field"
              placeholder="Istanbul"
            />
          </div>
          <div>
            <label className="field-label">Vergi Dairesi</label>
            <input
              type="text"
              value={settings.taxOffice}
              onChange={(e) => updateField("taxOffice", e.target.value)}
              className="field"
              placeholder="Vergi Dairesi Adi"
            />
          </div>
          <div>
            <label className="field-label">Vergi Numarasi</label>
            <input
              type="text"
              value={settings.taxNumber}
              onChange={(e) => updateField("taxNumber", e.target.value)}
              className="field tabular"
              placeholder="1234567890"
            />
          </div>
          <div>
            <label className="field-label">
              <Phone className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
              Telefon 1
            </label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="field"
              placeholder="0 (212) 000 00 00"
            />
          </div>
          <div>
            <label className="field-label">Telefon 2</label>
            <input
              type="text"
              value={settings.phone2}
              onChange={(e) => updateField("phone2", e.target.value)}
              className="field"
              placeholder="0 (532) 000 00 00"
            />
          </div>
          <div>
            <label className="field-label">
              <Mail className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
              E-Posta
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="field"
              placeholder="info@firma.com"
            />
          </div>
          <div>
            <label className="field-label">
              <Globe className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
              Web Sitesi
            </label>
            <input
              type="text"
              value={settings.website}
              onChange={(e) => updateField("website", e.target.value)}
              className="field"
              placeholder="www.firma.com"
            />
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            Degisiklikler bir sonraki PDF ciktisinda yansiyacak
          </p>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={pendingLogoDelete}
        onCancel={() => setPendingLogoDelete(false)}
        onConfirm={handleLogoDelete}
        title="Logoyu sil"
        description="Firma logosu kaldirilacak. PDF ciktilarinda logo gosterilmeyecek."
        confirmLabel="Logoyu Sil"
      />
    </div>
  );
}
