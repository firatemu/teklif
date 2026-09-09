"use client";

import { useState, useEffect, useRef } from "react";
import { Save, Upload, Trash2, Building2, Phone, Mail, Globe, MapPin, FileText, ImageIcon } from "lucide-react";

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
  const [settings, setSettings] = useState<CompanySettingsData | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
    loadLogo();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      console.error("Settings load error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadLogo() {
    try {
      const res = await fetch("/api/settings/logo");
      if (res.ok) {
        const data = await res.json();
        if (data.hasLogo) {
          setLogoUrl(data.logoDataUrl);
        }
      }
    } catch (e) {
      console.error("Logo load error:", e);
    }
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Firma bilgileri başarıyla kaydedildi." });
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Kaydetme hatası." });
      }
    } catch {
      setMessage({ type: "error", text: "Bağlantı hatası." });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(file: File) {
    setUploading(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("logo", file);
    try {
      const res = await fetch("/api/settings/logo", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Logo başarıyla yüklendi." });
        loadLogo();
      } else {
        const err = await res.json();
        setMessage({ type: "error", text: err.error || "Logo yükleme hatası." });
      }
    } catch {
      setMessage({ type: "error", text: "Bağlantı hatası." });
    } finally {
      setUploading(false);
    }
  }

  async function handleLogoDelete() {
    if (!confirm("Logoyu silmek istediğinize emin misiniz?")) return;
    try {
      const res = await fetch("/api/settings/logo", { method: "DELETE" });
      if (res.ok) {
        setLogoUrl(null);
        setMessage({ type: "success", text: "Logo silindi." });
      }
    } catch {
      setMessage({ type: "error", text: "Logo silme hatası." });
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleLogoUpload(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleLogoUpload(file);
  }

  function updateField(field: keyof CompanySettingsData, value: string) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-20 text-slate-500">Ayarlar yüklenemedi.</div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Building2 className="h-7 w-7 text-blue-600" />
          Firma Ayarları
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Firma bilgilerinizi güncelleyin. Bu bilgiler teklif PDF&apos;lerinde kullanılacaktır.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Logo Section */}
      <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-blue-600" />
          Firma Logosu
        </h2>
        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            {logoUrl ? (
              <div className="relative group">
                <img
                  src={logoUrl}
                  alt="Firma logosu"
                  className="h-24 w-24 rounded-xl object-contain border border-slate-200 bg-white p-2"
                />
                <button
                  onClick={handleLogoDelete}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                <ImageIcon className="h-8 w-8 text-slate-400" />
              </div>
            )}
          </div>

          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              {uploading ? "Yükleniyor..." : "Logo yüklemek için tıklayın veya sürükleyin"}
            </p>
            <p className="text-xs text-slate-500 mt-1">PNG, JPG veya WebP • Maks. 2MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Company Info Form */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          Firma Bilgileri
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Firma Adı */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Building2 className="inline h-4 w-4 mr-1 text-slate-400" />
              Firma Adı
            </label>
            <input
              type="text"
              value={settings.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Firma Adınız Ltd. Şti."
            />
          </div>

          {/* Kısa Ad */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Kısa Ad</label>
            <input
              type="text"
              value={settings.shortName}
              onChange={(e) => updateField("shortName", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Firma Kısa Adı"
            />
          </div>

          {/* Slogan/Tagline */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Slogan / Ünvan</label>
            <input
              type="text"
              value={settings.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Yetkili İş Ortağı"
            />
          </div>

          {/* Adres */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <MapPin className="inline h-4 w-4 mr-1 text-slate-400" />
              Adres
            </label>
            <textarea
              value={settings.address}
              onChange={(e) => updateField("address", e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              placeholder="Tam adres"
            />
          </div>

          {/* Şehir */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Şehir</label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => updateField("city", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="İstanbul"
            />
          </div>

          {/* Vergi Dairesi */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Vergi Dairesi</label>
            <input
              type="text"
              value={settings.taxOffice}
              onChange={(e) => updateField("taxOffice", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="Vergi Dairesi Adı"
            />
          </div>

          {/* Vergi Numarası */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Vergi Numarası</label>
            <input
              type="text"
              value={settings.taxNumber}
              onChange={(e) => updateField("taxNumber", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="1234567890"
            />
          </div>

          {/* Telefon 1 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Phone className="inline h-4 w-4 mr-1 text-slate-400" />
              Telefon 1
            </label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="0 (212) 000 00 00"
            />
          </div>

          {/* Telefon 2 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Phone className="inline h-4 w-4 mr-1 text-slate-400" />
              Telefon 2
            </label>
            <input
              type="text"
              value={settings.phone2}
              onChange={(e) => updateField("phone2", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="0 (532) 000 00 00"
            />
          </div>

          {/* E-posta */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Mail className="inline h-4 w-4 mr-1 text-slate-400" />
              E-Posta
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="info@firma.com"
            />
          </div>

          {/* Web Sitesi */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              <Globe className="inline h-4 w-4 mr-1 text-slate-400" />
              Web Sitesi
            </label>
            <input
              type="text"
              value={settings.website}
              onChange={(e) => updateField("website", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder="www.firma.com"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
