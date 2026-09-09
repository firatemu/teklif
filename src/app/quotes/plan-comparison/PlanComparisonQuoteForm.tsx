"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/formatters";
import {
  Layers,
  Building2,
  Phone,
  Mail,
  Receipt,
  Download,
  Save,
  AlertCircle,
  Plus,
  Trash2,
  UserCheck,
  Percent,
} from "lucide-react";

interface Product {
  id: number;
  category: string;
  subCategory: string | null;
  name: string;
  productType: "PLAN_BASED" | "FIXED";
  plan1FirstYear: number | null;
  plan1Renewal: number | null;
  plan2FirstYear: number | null;
  plan2Renewal: number | null;
  plan3FirstYear: number | null;
  plan3Renewal: number | null;
  fixedPrice: number | null;
  isActive: boolean;
}

interface PlanComparisonItemForm {
  id?: number;
  productId: number;
  displayName: string;
  plan1FirstYear: number;
  plan1Renewal: number;
  plan2FirstYear: number;
  plan2Renewal: number;
  plan3FirstYear: number;
  plan3Renewal: number;
}

interface PlanComparisonQuoteFormProps {
  initialQuote?: any;
}

export default function PlanComparisonQuoteForm({
  initialQuote,
}: PlanComparisonQuoteFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialQuote);

  const [customerName, setCustomerName] = useState(initialQuote?.customerName || "");
  const [preparedByName, setPreparedByName] = useState(initialQuote?.preparedByName || "");
  const [customerTaxOffice, setCustomerTaxOffice] = useState(initialQuote?.customerTaxOffice || "");
  const [customerTaxNumber, setCustomerTaxNumber] = useState(initialQuote?.customerTaxNumber || "");
  const [customerPhone, setCustomerPhone] = useState(initialQuote?.customerPhone || "");
  const [customerEmail, setCustomerEmail] = useState(initialQuote?.customerEmail || "");
  const [quoteDate, setQuoteDate] = useState(
    initialQuote?.quoteDate
      ? new Date(initialQuote.quoteDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );

  const [notes, setNotes] = useState(
    initialQuote?.notes ||
      "Fiyatlarımıza KDV dahil değildir.\nTeklifimiz 15 gün süreyle geçerlidir.\nKurulum, uyarlama ve eğitim hizmetleri dahildir.\nLogo Özel Entegratör kontör paketleri ayrıca faturalandırılacaktır."
  );

  const [items, setItems] = useState<PlanComparisonItemForm[]>(
    initialQuote?.planComparisonItems || []
  );

  // Catalog products
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Add Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedSubCat, setSelectedSubCat] = useState("");
  const [selectedProdId, setSelectedProdId] = useState<number | null>(null);

  // Modal custom values
  const [modalDisplayName, setModalDisplayName] = useState("");
  const [modalP1First, setModalP1First] = useState("0");
  const [modalP1Ren, setModalP1Ren] = useState("0");
  const [modalP2First, setModalP2First] = useState("0");
  const [modalP2Ren, setModalP2Ren] = useState("0");
  const [modalP3First, setModalP3First] = useState("0");
  const [modalP3Ren, setModalP3Ren] = useState("0");
  const [modalDiscountPct, setModalDiscountPct] = useState("");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/products?activeOnly=true")
      .then((res) => res.json())
      .then((data) => {
        setCatalog(data);
        if (data.length > 0) {
          setSelectedCat(data[0].category);
        }
      })
      .finally(() => setLoadingCatalog(false));
  }, []);

  const categories = Array.from(new Set(catalog.map((p) => p.category)));
  const subCategories = Array.from(
    new Set(
      catalog
        .filter((p) => p.category === selectedCat && p.subCategory)
        .map((p) => p.subCategory as string)
    )
  );

  const availableProducts = catalog.filter((p) => {
    if (p.category !== selectedCat) return false;
    if (subCategories.length > 0 && selectedSubCat) {
      return p.subCategory === selectedSubCat;
    }
    return true;
  });

  const activeProduct = catalog.find((p) => p.id === selectedProdId);

  // Sync modal values whenever activeProduct changes
  useEffect(() => {
    if (!activeProduct) return;
    setModalDisplayName(activeProduct.name);
    setModalDiscountPct("");
    if (activeProduct.productType === "PLAN_BASED") {
      setModalP1First((activeProduct.plan1FirstYear || 0).toString());
      setModalP1Ren((activeProduct.plan1Renewal || 0).toString());
      setModalP2First((activeProduct.plan2FirstYear || 0).toString());
      setModalP2Ren((activeProduct.plan2Renewal || 0).toString());
      setModalP3First((activeProduct.plan3FirstYear || 0).toString());
      setModalP3Ren((activeProduct.plan3Renewal || 0).toString());
    } else {
      const fPrice = (activeProduct.fixedPrice || 0).toString();
      setModalP1First(fPrice);
      setModalP1Ren("0");
      setModalP2First(fPrice);
      setModalP2Ren("0");
      setModalP3First(fPrice);
      setModalP3Ren("0");
    }
  }, [activeProduct]);

  const handleOpenItemModal = () => {
    if (catalog.length > 0) {
      const cat = categories[0] || "";
      setSelectedCat(cat);
      const subs = catalog.filter((p) => p.category === cat && p.subCategory);
      if (subs.length > 0) {
        setSelectedSubCat(subs[0].subCategory!);
      } else {
        setSelectedSubCat("");
      }
      const firstProd = catalog.find((p) => p.category === cat);
      setSelectedProdId(firstProd ? firstProd.id : null);
    }
    setModalDiscountPct("");
    setIsItemModalOpen(true);
  };

  const handleApplyModalDiscount = () => {
    const pct = parseFloat(modalDiscountPct);
    if (isNaN(pct) || pct <= 0 || pct > 100) return;
    const factor = (100 - pct) / 100;
    setModalP1First((prev) => (Math.round(parseFloat(prev || "0") * factor * 100) / 100).toString());
    setModalP1Ren((prev) => (Math.round(parseFloat(prev || "0") * factor * 100) / 100).toString());
    setModalP2First((prev) => (Math.round(parseFloat(prev || "0") * factor * 100) / 100).toString());
    setModalP2Ren((prev) => (Math.round(parseFloat(prev || "0") * factor * 100) / 100).toString());
    setModalP3First((prev) => (Math.round(parseFloat(prev || "0") * factor * 100) / 100).toString());
    setModalP3Ren((prev) => (Math.round(parseFloat(prev || "0") * factor * 100) / 100).toString());
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;

    const newItem: PlanComparisonItemForm = {
      productId: activeProduct.id,
      displayName: modalDisplayName.trim() || activeProduct.name,
      plan1FirstYear: parseFloat(modalP1First) || 0,
      plan1Renewal: parseFloat(modalP1Ren) || 0,
      plan2FirstYear: parseFloat(modalP2First) || 0,
      plan2Renewal: parseFloat(modalP2Ren) || 0,
      plan3FirstYear: parseFloat(modalP3First) || 0,
      plan3Renewal: parseFloat(modalP3Ren) || 0,
    };

    setItems([...items, newItem]);
    setIsItemModalOpen(false);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof PlanComparisonItemForm,
    value: any
  ) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleApplyRowDiscount = (index: number) => {
    const pctInput = prompt("Bu satırdaki tüm plan fiyatlarına uygulamak istediğiniz iskonto yüzdesini giriniz (Örn: 15):");
    if (!pctInput) return;
    const pct = parseFloat(pctInput);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      alert("Lütfen 0 ile 100 arasında geçerli bir iskonto oranı giriniz.");
      return;
    }
    const factor = (100 - pct) / 100;
    setItems((prev) => {
      const next = [...prev];
      const it = next[index];
      next[index] = {
        ...it,
        plan1FirstYear: Math.round((it.plan1FirstYear || 0) * factor * 100) / 100,
        plan1Renewal: Math.round((it.plan1Renewal || 0) * factor * 100) / 100,
        plan2FirstYear: Math.round((it.plan2FirstYear || 0) * factor * 100) / 100,
        plan2Renewal: Math.round((it.plan2Renewal || 0) * factor * 100) / 100,
        plan3FirstYear: Math.round((it.plan3FirstYear || 0) * factor * 100) / 100,
        plan3Renewal: Math.round((it.plan3Renewal || 0) * factor * 100) / 100,
      };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Compute 6 column totals
  const p1FirstTotal = items.reduce((acc, it) => acc + (it.plan1FirstYear || 0), 0);
  const p1RenTotal = items.reduce((acc, it) => acc + (it.plan1Renewal || 0), 0);
  const p2FirstTotal = items.reduce((acc, it) => acc + (it.plan2FirstYear || 0), 0);
  const p2RenTotal = items.reduce((acc, it) => acc + (it.plan2Renewal || 0), 0);
  const p3FirstTotal = items.reduce((acc, it) => acc + (it.plan3FirstYear || 0), 0);
  const p3RenTotal = items.reduce((acc, it) => acc + (it.plan3Renewal || 0), 0);

  const handleSaveQuote = async (downloadPdf = false) => {
    setError("");

    if (!customerName.trim()) {
      setError("Müşteri adı zorunludur.");
      return;
    }

    if (items.length === 0) {
      setError("Teklife en az bir ürün eklemelisiniz.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        quoteType: "PLAN_COMPARISON",
        quoteDate,
        customerName: customerName.trim(),
        preparedByName: preparedByName.trim() || null,
        customerTaxOffice: customerTaxOffice.trim() || null,
        customerTaxNumber: customerTaxNumber.trim() || null,
        customerPhone: customerPhone.trim() || null,
        customerEmail: customerEmail.trim() || null,
        notes: notes.trim() || null,
        planComparisonItems: items,
      };

      const url = isEdit ? `/api/quotes/${initialQuote.id}` : "/api/quotes";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Kaydedilirken bir hata oluştu.");
        setSaving(false);
        return;
      }

      if (downloadPdf) {
        window.open(`/api/quotes/${data.id}/pdf`, "_blank");
      }

      router.push(`/quotes/${data.id}`);
      router.refresh();
    } catch {
      setError("Bağlantı hatası oluştu.");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="h-6 w-6 text-blue-700" />
            <h1 className="text-2xl font-black text-slate-900">
              {isEdit
                ? `Plan Karşılaştırmalı Teklifi Düzenle (${initialQuote.quoteNumber})`
                : "Yeni Plan Karşılaştırmalı Teklif (Tür 2)"}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Plan 1, Plan 2 ve Plan 3 alternatiflerini yan yana kıyaslayan profesyonel teklif tablosu (Fiyatlar ve kalemler düzenlenebilir)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSaveQuote(false)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={() => handleSaveQuote(true)}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Kaydet & PDF İndir
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Customer Information Card */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-4 flex items-center gap-1.5">
          <Building2 className="h-4 w-4" />
          Genel Bilgiler & Müşteri
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700">Müşteri / Firma Adı *</label>
            <input
              type="text"
              required
              placeholder="Örn: ABC Teknoloji San. ve Tic. Ltd. Şti."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Teklif Tarihi</label>
            <input
              type="date"
              value={quoteDate}
              onChange={(e) => setQuoteDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Teklif Hazırlayan</label>
            <div className="relative mt-1">
              <UserCheck className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Örn: Azem Yılmaz (Satış Yöneticisi)"
                value={preparedByName}
                onChange={(e) => setPreparedByName(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 py-2 pl-8 pr-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Telefon</label>
            <div className="relative mt-1">
              <Phone className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="0 (212) 000 00 00"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 py-2 pl-8 pr-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">E-Posta</label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="email"
                placeholder="info@firma.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 py-2 pl-8 pr-2 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plan Comparison Items Grid */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              Karşılaştırma Tablosu Kalemleri ({items.length})
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Eklenen ürünlerin isimlerini ve her plan için ilk yıl / yenileme fiyatlarını tablo üzerinden doğrudan güncelleyebilirsiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenItemModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Katalogdan Ürün Ekle
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Henüz tabloya ürün eklenmedi. Yukarıdaki <strong>Katalogdan Ürün Ekle</strong> butonuna tıklayarak ürün ekleyebilirsiniz.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-xs border border-slate-200">
              <thead>
                <tr className="border-b border-slate-200">
                  <th rowSpan={2} className="px-3 py-2 bg-slate-100 text-slate-800 font-bold border-r border-slate-200 min-w-[200px]">
                    Ürün / Hizmet Açıklaması
                  </th>
                  <th colSpan={2} className="px-2 py-2 bg-blue-100 text-blue-950 font-black text-sm text-center border-r border-slate-200 tracking-wide">
                    PLAN 1
                  </th>
                  <th colSpan={2} className="px-2 py-2 bg-amber-100 text-amber-950 font-black text-sm text-center border-r border-slate-200 tracking-wide">
                    PLAN 2
                  </th>
                  <th colSpan={2} className="px-2 py-2 bg-emerald-100 text-emerald-950 font-black text-sm text-center border-r border-slate-200 tracking-wide">
                    PLAN 3
                  </th>
                  <th rowSpan={2} className="px-2 py-2 bg-slate-100 text-center w-20">
                    İşlem
                  </th>
                </tr>
                <tr className="border-b-2 border-slate-300 text-xs bg-slate-50">
                  <th className="px-2 py-1.5 text-center font-bold text-blue-800 bg-blue-50/60 w-24">İlk Yıl</th>
                  <th className="px-2 py-1.5 text-center font-bold text-blue-800 bg-blue-50/60 border-r border-slate-200 w-24">Yenileme</th>
                  <th className="px-2 py-1.5 text-center font-bold text-amber-800 bg-amber-50/60 w-24">İlk Yıl</th>
                  <th className="px-2 py-1.5 text-center font-bold text-amber-800 bg-amber-50/60 border-r border-slate-200 w-24">Yenileme</th>
                  <th className="px-2 py-1.5 text-center font-bold text-emerald-800 bg-emerald-50/60 w-24">İlk Yıl</th>
                  <th className="px-2 py-1.5 text-center font-bold text-emerald-800 bg-emerald-50/60 border-r border-slate-200 w-24">Yenileme</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-1.5 font-medium text-slate-900 border-r border-slate-200">
                      <input
                        type="text"
                        value={it.displayName}
                        onChange={(e) => handleUpdateItem(idx, "displayName", e.target.value)}
                        className="w-full rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white bg-transparent px-2 py-1 text-xs text-slate-900 focus:outline-none transition-colors"
                        placeholder="Ürün adı"
                      />
                    </td>
                    <td className="p-1.5 text-right font-medium text-slate-800 bg-blue-50/40">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.plan1FirstYear ?? 0}
                        onChange={(e) => handleUpdateItem(idx, "plan1FirstYear", parseFloat(e.target.value) || 0)}
                        className="w-24 text-right rounded border border-blue-200 bg-white/80 focus:bg-white focus:border-blue-600 px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none transition-colors"
                      />
                    </td>
                    <td className="p-1.5 text-right font-medium text-slate-800 bg-blue-50/40 border-r border-slate-200">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.plan1Renewal ?? 0}
                        onChange={(e) => handleUpdateItem(idx, "plan1Renewal", parseFloat(e.target.value) || 0)}
                        className="w-24 text-right rounded border border-blue-200 bg-white/80 focus:bg-white focus:border-blue-600 px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none transition-colors"
                      />
                    </td>
                    <td className="p-1.5 text-right font-medium text-slate-800 bg-amber-50/40">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.plan2FirstYear ?? 0}
                        onChange={(e) => handleUpdateItem(idx, "plan2FirstYear", parseFloat(e.target.value) || 0)}
                        className="w-24 text-right rounded border border-amber-200 bg-white/80 focus:bg-white focus:border-amber-600 px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none transition-colors"
                      />
                    </td>
                    <td className="p-1.5 text-right font-medium text-slate-800 bg-amber-50/40 border-r border-slate-200">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.plan2Renewal ?? 0}
                        onChange={(e) => handleUpdateItem(idx, "plan2Renewal", parseFloat(e.target.value) || 0)}
                        className="w-24 text-right rounded border border-amber-200 bg-white/80 focus:bg-white focus:border-amber-600 px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none transition-colors"
                      />
                    </td>
                    <td className="p-1.5 text-right font-medium text-slate-800 bg-emerald-50/40">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.plan3FirstYear ?? 0}
                        onChange={(e) => handleUpdateItem(idx, "plan3FirstYear", parseFloat(e.target.value) || 0)}
                        className="w-24 text-right rounded border border-emerald-200 bg-white/80 focus:bg-white focus:border-emerald-600 px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none transition-colors"
                      />
                    </td>
                    <td className="p-1.5 text-right font-medium text-slate-800 bg-emerald-50/40 border-r border-slate-200">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={it.plan3Renewal ?? 0}
                        onChange={(e) => handleUpdateItem(idx, "plan3Renewal", parseFloat(e.target.value) || 0)}
                        className="w-24 text-right rounded border border-emerald-200 bg-white/80 focus:bg-white focus:border-emerald-600 px-2 py-1 text-xs font-semibold text-slate-900 focus:outline-none transition-colors"
                      />
                    </td>
                    <td className="p-1.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          title="Tüm planlara iskonto uygula (%)"
                          onClick={() => handleApplyRowDiscount(idx)}
                          className="rounded p-1 text-slate-400 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                          <Percent className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Satırı Sil"
                          onClick={() => handleRemoveItem(idx)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Column Totals Row */}
                <tr className="bg-slate-100/90 font-black text-xs border-t-2 border-slate-300">
                  <td className="px-3 py-3 text-slate-900 border-r border-slate-200 uppercase">
                    TOPLAM
                  </td>
                  <td className="px-2 py-3 text-right text-blue-900 bg-blue-100/70 font-bold">
                    {formatCurrency(p1FirstTotal)}
                  </td>
                  <td className="px-2 py-3 text-right text-blue-900 bg-blue-100/70 border-r border-slate-200 font-bold">
                    {formatCurrency(p1RenTotal)}
                  </td>
                  <td className="px-2 py-3 text-right text-amber-950 bg-amber-100/80 font-bold">
                    {formatCurrency(p2FirstTotal)}
                  </td>
                  <td className="px-2 py-3 text-right text-amber-950 bg-amber-100/80 border-r border-slate-200 font-bold">
                    {formatCurrency(p2RenTotal)}
                  </td>
                  <td className="px-2 py-3 text-right text-emerald-900 bg-emerald-100/70 font-bold">
                    {formatCurrency(p3FirstTotal)}
                  </td>
                  <td className="px-2 py-3 text-right text-emerald-900 bg-emerald-100/70 border-r border-slate-200 font-bold">
                    {formatCurrency(p3RenTotal)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
          Teklif Notları (Her satır PDF çıktısında ayrı bir madde işareti olarak görünecektir)
        </h2>
        <textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Teklif şartları, entegratör kontör bilgileri vb..."
          className="block w-full rounded-lg border border-slate-300 p-3 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
        />
      </div>

      {/* Add Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4">Katalogdan Ürün Ekle</h2>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kategori</label>
                  <select
                    value={selectedCat}
                    onChange={(e) => {
                      const newCat = e.target.value;
                      setSelectedCat(newCat);
                      const subs = catalog.filter((p) => p.category === newCat && p.subCategory);
                      if (subs.length > 0) {
                        setSelectedSubCat(subs[0].subCategory!);
                      } else {
                        setSelectedSubCat("");
                      }
                      const prods = catalog.filter((p) => p.category === newCat);
                      setSelectedProdId(prods.length > 0 ? prods[0].id : null);
                    }}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {subCategories.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Alt Kategori</label>
                    <select
                      value={selectedSubCat}
                      onChange={(e) => {
                        const newSub = e.target.value;
                        setSelectedSubCat(newSub);
                        const prods = catalog.filter(
                          (p) => p.category === selectedCat && p.subCategory === newSub
                        );
                        setSelectedProdId(prods.length > 0 ? prods[0].id : null);
                      }}
                      className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                    >
                      {subCategories.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Ürün</label>
                <select
                  value={selectedProdId ?? ""}
                  onChange={(e) => setSelectedProdId(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                >
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.productType === "PLAN_BASED" ? "Planlı" : "Sabit Fiyat"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Ürün / Hizmet Açıklaması</label>
                <input
                  type="text"
                  value={modalDisplayName}
                  onChange={(e) => setModalDisplayName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  required
                />
              </div>

              {activeProduct && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-slate-800">Plan Fiyatları (Düzenlenebilir):</div>
                    {/* Quick Discount Tool */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-medium">Hızlı İskonto:</span>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          placeholder="%"
                          value={modalDiscountPct}
                          onChange={(e) => setModalDiscountPct(e.target.value)}
                          className="w-14 rounded-l border border-slate-300 px-1.5 py-1 text-xs text-right focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleApplyModalDiscount}
                          className="rounded-r bg-amber-600 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
                        >
                          Uygula
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Plan 1 */}
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-2.5">
                      <div className="text-[11px] font-bold text-blue-900 mb-1.5 text-center">PLAN 1</div>
                      <div className="space-y-1.5">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600">İlk Yıl (₺)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={modalP1First}
                            onChange={(e) => setModalP1First(e.target.value)}
                            className="w-full rounded border border-blue-200 bg-white px-2 py-1 text-xs text-right font-semibold focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600">Yenileme (₺)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={modalP1Ren}
                            onChange={(e) => setModalP1Ren(e.target.value)}
                            className="w-full rounded border border-blue-200 bg-white px-2 py-1 text-xs text-right font-semibold focus:border-blue-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Plan 2 */}
                    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5">
                      <div className="text-[11px] font-bold text-amber-900 mb-1.5 text-center">PLAN 2</div>
                      <div className="space-y-1.5">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600">İlk Yıl (₺)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={modalP2First}
                            onChange={(e) => setModalP2First(e.target.value)}
                            className="w-full rounded border border-amber-200 bg-white px-2 py-1 text-xs text-right font-semibold focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600">Yenileme (₺)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={modalP2Ren}
                            onChange={(e) => setModalP2Ren(e.target.value)}
                            className="w-full rounded border border-amber-200 bg-white px-2 py-1 text-xs text-right font-semibold focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Plan 3 */}
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-2.5">
                      <div className="text-[11px] font-bold text-emerald-900 mb-1.5 text-center">PLAN 3</div>
                      <div className="space-y-1.5">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600">İlk Yıl (₺)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={modalP3First}
                            onChange={(e) => setModalP3First(e.target.value)}
                            className="w-full rounded border border-emerald-200 bg-white px-2 py-1 text-xs text-right font-semibold focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-600">Yenileme (₺)</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={modalP3Ren}
                            onChange={(e) => setModalP3Ren(e.target.value)}
                            className="w-full rounded border border-emerald-200 bg-white px-2 py-1 text-xs text-right font-semibold focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                >
                  Tabloya Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
