"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  formatCurrency,
  formatDate,
} from "@/lib/formatters";
import {
  calculateLineItem,
  calculateQuote,
  resolveClassicUnitPrice,
  formatPlanBasisLabel,
} from "@/lib/calculations";
import {
  Plus,
  Trash2,
  FileText,
  Building2,
  Phone,
  Mail,
  Receipt,
  Download,
  Save,
  AlertCircle,
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

interface ClassicItemForm {
  id?: number;
  productId?: number | null;
  source: "CATALOG" | "MANUAL";
  category?: string;
  subCategory?: string;
  displayName: string;
  selectedPlan: "PLAN_1" | "PLAN_2" | "PLAN_3" | null;
  priceBasis: "FIRST_YEAR" | "RENEWAL" | null;
  unitPrice: number;
  quantity: number;
  lineDiscountType: "PERCENT" | "AMOUNT" | null;
  lineDiscountValue: number | null;
  lineTotal: number;
}

interface ClassicQuoteFormProps {
  initialQuote?: any;
}

export default function ClassicQuoteForm({ initialQuote }: ClassicQuoteFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initialQuote);

  // Form states
  const [customerName, setCustomerName] = useState(initialQuote?.customerName || "");
  const [customerTaxOffice, setCustomerTaxOffice] = useState(initialQuote?.customerTaxOffice || "");
  const [customerTaxNumber, setCustomerTaxNumber] = useState(initialQuote?.customerTaxNumber || "");
  const [customerPhone, setCustomerPhone] = useState(initialQuote?.customerPhone || "");
  const [customerEmail, setCustomerEmail] = useState(initialQuote?.customerEmail || "");
  const [quoteDate, setQuoteDate] = useState(
    initialQuote?.quoteDate
      ? new Date(initialQuote.quoteDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );

  const [items, setItems] = useState<ClassicItemForm[]>(() => {
    if (initialQuote?.classicItems && initialQuote.classicItems.length > 0) {
      return initialQuote.classicItems.map((item: any) => ({
        ...item,
        source: item.productId ? "CATALOG" : "MANUAL",
      }));
    }
    return [];
  });

  const [generalDiscountType, setGeneralDiscountType] = useState<"PERCENT" | "AMOUNT" | null>(
    initialQuote?.generalDiscountType || null
  );
  const [generalDiscountValue, setGeneralDiscountValue] = useState<string>(
    initialQuote?.generalDiscountValue?.toString() || ""
  );
  const [vatRate, setVatRate] = useState<number>(
    initialQuote?.vatRate !== undefined ? initialQuote.vatRate : 20
  );

  // Catalog products
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Add Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState<"CATALOG" | "MANUAL">("CATALOG");
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedSubCat, setSelectedSubCat] = useState("");
  const [selectedProdId, setSelectedProdId] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"PLAN_1" | "PLAN_2" | "PLAN_3">("PLAN_1");
  const [selectedBasis, setSelectedBasis] = useState<"FIRST_YEAR" | "RENEWAL">("FIRST_YEAR");
  const [modalUnitPrice, setModalUnitPrice] = useState<string>("");
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [modalQty, setModalQty] = useState(1);
  const [modalDiscType, setModalDiscType] = useState<"PERCENT" | "AMOUNT" | null>(null);
  const [modalDiscVal, setModalDiscVal] = useState("");

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

  // Sync modal price when selection changes
  useEffect(() => {
    if (modalSource === "CATALOG" && activeProduct) {
      const p = resolveClassicUnitPrice(activeProduct as any, selectedPlan, selectedBasis);
      setModalUnitPrice(p.toString());
    }
  }, [modalSource, activeProduct, selectedPlan, selectedBasis]);

  const handleOpenItemModal = () => {
    setModalSource("CATALOG");
    setModalQty(1);
    setModalDiscType(null);
    setModalDiscVal("");
    setManualName("");
    setManualPrice("");

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
      if (firstProd) {
        const initialPrice = resolveClassicUnitPrice(firstProd as any, "PLAN_1", "FIRST_YEAR");
        setModalUnitPrice(initialPrice.toString());
      }
    }

    setSelectedPlan("PLAN_1");
    setSelectedBasis("FIRST_YEAR");
    setIsItemModalOpen(true);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();

    let displayName = "";
    let unitPrice = 0;
    let productId: number | null = null;
    let itemPlan: "PLAN_1" | "PLAN_2" | "PLAN_3" | null = null;
    let itemBasis: "FIRST_YEAR" | "RENEWAL" | null = null;

    if (modalSource === "CATALOG") {
      if (!activeProduct) return;
      productId = activeProduct.id;

      if (activeProduct.productType === "PLAN_BASED") {
        itemPlan = selectedPlan;
        itemBasis = selectedBasis;
        displayName = `${activeProduct.name} (${formatPlanBasisLabel(selectedPlan, selectedBasis)})`;
      } else {
        displayName = activeProduct.name;
      }
      unitPrice = parseFloat(modalUnitPrice) || 0;
    } else {
      if (!manualName.trim()) return;
      displayName = manualName.trim();
      unitPrice = parseFloat(manualPrice) || 0;
    }

    const calc = calculateLineItem({
      quantity: modalQty,
      unitPrice,
      lineDiscountType: modalDiscType,
      lineDiscountValue: modalDiscVal ? parseFloat(modalDiscVal) : null,
    });

    const newItem: ClassicItemForm = {
      source: modalSource,
      productId,
      displayName,
      selectedPlan: itemPlan,
      priceBasis: itemBasis,
      unitPrice,
      quantity: modalQty,
      lineDiscountType: modalDiscType,
      lineDiscountValue: modalDiscVal ? parseFloat(modalDiscVal) : null,
      lineTotal: calc.lineTotal,
    };

    setItems([...items, newItem]);
    setIsItemModalOpen(false);
  };

  const handleUpdateItem = (index: number, updates: Partial<ClassicItemForm>) => {
    setItems((prev) => {
      const next = [...prev];
      const current = next[index];
      const merged = { ...current, ...updates };
      const calc = calculateLineItem({
        quantity: merged.quantity,
        unitPrice: merged.unitPrice,
        lineDiscountType: merged.lineDiscountType,
        lineDiscountValue: merged.lineDiscountValue,
      });
      next[index] = { ...merged, lineTotal: calc.lineTotal };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const quoteCalculation = calculateQuote({
    items: items.map((it) => ({
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      lineDiscountType: it.lineDiscountType,
      lineDiscountValue: it.lineDiscountValue,
    })),
    generalDiscountType,
    generalDiscountValue: generalDiscountValue ? parseFloat(generalDiscountValue) : null,
    vatRate,
  });

  const handleSaveQuote = async (downloadPdf = false) => {
    setError("");

    if (!customerName.trim()) {
      setError("Müşteri adı zorunludur.");
      return;
    }

    if (items.length === 0) {
      setError("Teklife en az bir ürün veya hizmet kalemi eklemelisiniz.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        quoteType: "CLASSIC",
        quoteDate,
        customerName: customerName.trim(),
        customerTaxOffice: customerTaxOffice.trim() || null,
        customerTaxNumber: customerTaxNumber.trim() || null,
        customerPhone: customerPhone.trim() || null,
        customerEmail: customerEmail.trim() || null,
        generalDiscountType,
        generalDiscountValue: generalDiscountValue ? parseFloat(generalDiscountValue) : null,
        vatRate,
        classicItems: items,
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-700" />
            <h1 className="text-2xl font-black text-slate-900">
              {isEdit ? `Klasik Teklifi Düzenle (${initialQuote.quoteNumber})` : "Yeni Klasik Teklif (Tür 1)"}
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Standart satır bazlı, iskonto ve KDV detaylı resmi teklif formu
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
          Müşteri / Alıcı Bilgileri
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
            <label className="block text-xs font-semibold text-slate-700">Vergi Dairesi</label>
            <input
              type="text"
              placeholder="Örn: Avcılar V.D."
              value={customerTaxOffice}
              onChange={(e) => setCustomerTaxOffice(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Vergi Numarası / TCKN</label>
            <input
              type="text"
              placeholder="1234567890"
              value={customerTaxNumber}
              onChange={(e) => setCustomerTaxNumber(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs"
            />
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
                placeholder="muhasebe@firma.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 py-2 pl-8 pr-2 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Builder */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
            <Receipt className="h-4 w-4" />
            Teklif Kalemleri ({items.length})
          </h2>
          <button
            type="button"
            onClick={handleOpenItemModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Kalem Ekle
          </button>
        </div>

        {items.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Henüz teklife kalem eklenmedi. Yukarıdaki <strong>Kalem Ekle</strong> butonuna tıklayarak katalogdan veya serbest ürün/hizmet ekleyebilirsiniz.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2 w-8 text-center">#</th>
                  <th className="px-3 py-2">Açıklama</th>
                  <th className="px-3 py-2 text-center w-24">Miktar</th>
                  <th className="px-3 py-2 text-right w-36">Birim Fiyat (₺)</th>
                  <th className="px-3 py-2 text-center w-40">İskonto</th>
                  <th className="px-3 py-2 text-right w-32">Tutar</th>
                  <th className="px-3 py-2 text-center w-12">Sil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3 py-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-900">
                        {it.displayName}
                        {it.source === "MANUAL" && (
                          <span className="ml-2 inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                            Serbest Giriş
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={it.quantity}
                        onChange={(e) =>
                          handleUpdateItem(idx, {
                            quantity: Math.max(1, parseInt(e.target.value) || 1),
                          })
                        }
                        className="w-16 rounded-md border border-slate-300 px-2 py-1 text-center font-bold text-slate-800 shadow-2xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs"
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={it.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(idx, {
                              unitPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-28 rounded-md border border-slate-300 px-2 py-1 text-right font-bold text-slate-800 shadow-2xs focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-xs"
                        />
                        <span className="text-slate-400 text-xs">₺</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <select
                          value={it.lineDiscountType || ""}
                          onChange={(e) =>
                            handleUpdateItem(idx, {
                              lineDiscountType: (e.target.value as any) || null,
                              lineDiscountValue: e.target.value ? it.lineDiscountValue || 0 : null,
                            })
                          }
                          className="rounded-md border border-slate-300 px-1.5 py-1 text-[11px] font-medium bg-white focus:border-blue-600 text-slate-700"
                        >
                          <option value="">Yok</option>
                          <option value="PERCENT">%</option>
                          <option value="AMOUNT">₺</option>
                        </select>
                        {it.lineDiscountType && (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={it.lineDiscountValue ?? ""}
                            onChange={(e) =>
                              handleUpdateItem(idx, {
                                lineDiscountValue: e.target.value ? parseFloat(e.target.value) : null,
                              })
                            }
                            placeholder="0"
                            className="w-16 rounded-md border border-slate-300 px-1.5 py-1 text-right text-xs font-semibold focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                      {formatCurrency(it.lineTotal)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Kalemi Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals Section */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left: General discount & VAT settings */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Genel İskonto & KDV Ayarları
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600">Genel İskonto Türü</label>
              <div className="mt-1 flex gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-700">
                  <input
                    type="radio"
                    name="genDiscType"
                    checked={generalDiscountType === null}
                    onChange={() => {
                      setGeneralDiscountType(null);
                      setGeneralDiscountValue("");
                    }}
                  />
                  Yok
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700">
                  <input
                    type="radio"
                    name="genDiscType"
                    checked={generalDiscountType === "PERCENT"}
                    onChange={() => setGeneralDiscountType("PERCENT")}
                  />
                  Yüzde (%)
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700">
                  <input
                    type="radio"
                    name="genDiscType"
                    checked={generalDiscountType === "AMOUNT"}
                    onChange={() => setGeneralDiscountType("AMOUNT")}
                  />
                  Tutar (₺)
                </label>
              </div>
            </div>

            {generalDiscountType && (
              <div>
                <label className="block text-xs font-medium text-slate-600">
                  İskonto Değeri {generalDiscountType === "PERCENT" ? "(%)" : "(₺)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={generalDiscountValue}
                  onChange={(e) => setGeneralDiscountValue(e.target.value)}
                  placeholder={generalDiscountType === "PERCENT" ? "10" : "1500"}
                  className="mt-1 block w-40 rounded-lg border border-slate-300 p-2 text-xs"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600">KDV Oranı (%)</label>
              <input
                type="number"
                value={vatRate}
                onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                className="mt-1 block w-32 rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right: Summary box */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-xs flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900">
            Hesaplanan Tutar Özeti
          </h3>

          <div className="space-y-2.5 my-3 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Ara Toplam:</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(quoteCalculation.subtotal)}
              </span>
            </div>

            {quoteCalculation.generalDiscountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Genel İskonto:</span>
                <span className="font-semibold">
                  -{formatCurrency(quoteCalculation.generalDiscountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>Net (KDV Hariç):</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(quoteCalculation.netAfterDiscount)}
              </span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>KDV Tutarı (%{vatRate}):</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(quoteCalculation.vatAmount)}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-blue-200 flex justify-between items-baseline">
            <span className="text-sm font-bold text-blue-950">Ödenecek Toplam:</span>
            <span className="text-xl font-black text-blue-800">
              {formatCurrency(quoteCalculation.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h2 className="text-base font-bold text-slate-900 mb-4">Teklif Kalemi Ekle</h2>

            {/* Source Toggle */}
            <div className="flex rounded-lg bg-slate-100 p-1 mb-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalSource("CATALOG")}
                className={`flex-1 rounded-md py-1.5 transition-colors ${
                  modalSource === "CATALOG"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Fiyat Kataloğundan Seç
              </button>
              <button
                type="button"
                onClick={() => setModalSource("MANUAL")}
                className={`flex-1 rounded-md py-1.5 transition-colors ${
                  modalSource === "MANUAL"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Serbest / Özel Kalem Gir
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              {modalSource === "CATALOG" ? (
                <>
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
                    <label className="block text-xs font-semibold text-slate-700">Ürün Seçimi</label>
                    <select
                      value={selectedProdId ?? ""}
                      onChange={(e) => setSelectedProdId(Number(e.target.value))}
                      className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                    >
                      {availableProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeProduct?.productType === "PLAN_BASED" && (
                    <div className="grid grid-cols-2 gap-3 rounded-lg bg-blue-50/70 p-3 border border-blue-100">
                      <div>
                        <label className="block text-xs font-semibold text-blue-900">Plan</label>
                        <select
                          value={selectedPlan}
                          onChange={(e) => setSelectedPlan(e.target.value as any)}
                          className="mt-1 block w-full rounded border border-blue-200 p-1.5 text-xs bg-white"
                        >
                          <option value="PLAN_1">Plan 1</option>
                          <option value="PLAN_2">Plan 2</option>
                          <option value="PLAN_3">Plan 3</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-blue-900">Fiyat Türü</label>
                        <select
                          value={selectedBasis}
                          onChange={(e) => setSelectedBasis(e.target.value as any)}
                          className="mt-1 block w-full rounded border border-blue-200 p-1.5 text-xs bg-white"
                        >
                          <option value="FIRST_YEAR">İlk Yıl</option>
                          <option value="RENEWAL">Yenileme</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Birim Fiyat (₺) *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={modalUnitPrice}
                      onChange={(e) => setModalUnitPrice(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs font-bold text-slate-900 focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    />
                    <p className="mt-1 text-[10px] text-slate-400">
                      Katalog fiyatı otomatik getirildi, dilerseniz teklife özel olarak değiştirebilirsiniz.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">
                      Ürün / Hizmet Açıklaması *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Logo Kurulum & Eğitim Hizmeti"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Birim Fiyat (₺) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="5000"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </>
              )}

              {/* Quantity and Line Discount */}
              <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Miktar</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={modalQty}
                    onChange={(e) => setModalQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">İskonto Türü</label>
                  <select
                    value={modalDiscType || ""}
                    onChange={(e) => setModalDiscType((e.target.value as any) || null)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
                  >
                    <option value="">Yok</option>
                    <option value="PERCENT">Yüzde (%)</option>
                    <option value="AMOUNT">Tutar (₺)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">İskonto Değeri</label>
                  <input
                    type="number"
                    step="0.01"
                    disabled={!modalDiscType}
                    value={modalDiscVal}
                    onChange={(e) => setModalDiscVal(e.target.value)}
                    placeholder={modalDiscType === "PERCENT" ? "10" : "500"}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs disabled:bg-slate-100"
                  />
                </div>
              </div>

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
                  Kalemi Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
