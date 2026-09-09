"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/formatters";
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
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
  sortOrder: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subCategory: "",
    productType: "PLAN_BASED" as "PLAN_BASED" | "FIXED",
    plan1FirstYear: "",
    plan1Renewal: "",
    plan2FirstYear: "",
    plan2Renewal: "",
    plan3FirstYear: "",
    plan3Renewal: "",
    fixedPrice: "",
    isActive: true,
  });
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        // Default open all categories
        const openMap: Record<string, boolean> = {};
        data.forEach((p: Product) => {
          openMap[p.category] = true;
        });
        setOpenCategories(openMap);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "",
      subCategory: "",
      productType: "PLAN_BASED",
      plan1FirstYear: "",
      plan1Renewal: "",
      plan2FirstYear: "",
      plan2Renewal: "",
      plan3FirstYear: "",
      plan3Renewal: "",
      fixedPrice: "",
      isActive: true,
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      subCategory: p.subCategory || "",
      productType: p.productType,
      plan1FirstYear: p.plan1FirstYear?.toString() || "",
      plan1Renewal: p.plan1Renewal?.toString() || "",
      plan2FirstYear: p.plan2FirstYear?.toString() || "",
      plan2Renewal: p.plan2Renewal?.toString() || "",
      plan3FirstYear: p.plan3FirstYear?.toString() || "",
      plan3Renewal: p.plan3Renewal?.toString() || "",
      fixedPrice: p.fixedPrice?.toString() || "",
      isActive: p.isActive,
    });
    setModalError("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError("");

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setModalError(data.error || "İşlem sırasında hata oluştu.");
        setSaving(false);
        return;
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch {
      setModalError("Bağlantı hatası oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`\"${p.name}\" ürününü silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Silme başarısız.");
        return;
      }
      fetchProducts();
    } catch {
      alert("Silinirken hata oluştu.");
    }
  };

  // Distinct category list for suggestions
  const existingCategories = Array.from(new Set(products.map((p) => p.category)));
  const existingSubCategories = Array.from(
    new Set(products.map((p) => p.subCategory).filter(Boolean))
  ) as string[];

  // Filter products by search
  const filteredProducts = products.filter((p) => {
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(term))
    );
  });

  // Group by category -> subcategory
  const grouped: Record<string, Record<string, Product[]>> = {};
  filteredProducts.forEach((p) => {
    if (!grouped[p.category]) grouped[p.category] = {};
    const sub = p.subCategory || "Genel";
    if (!grouped[p.category][sub]) grouped[p.category][sub] = [];
    grouped[p.category][sub].push(p);
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-700" />
            <h1 className="text-2xl font-black text-slate-900">Ürün Kataloğu</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Logo Edge T-Series ve diğer ürün/hizmet fiyat listesi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ürün veya kategori ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Ürün
          </button>
        </div>
      </div>

      {/* Catalog Listing */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Ürünler yükleniyor...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="py-20 text-center text-slate-500">
          Arama kriterine uygun ürün bulunamadı.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([category, subGroups]) => {
            const isOpen = openCategories[category] ?? true;
            return (
              <div
                key={category}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs"
              >
                {/* Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="flex w-full items-center justify-between bg-slate-50/80 px-5 py-3.5 text-left font-bold text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-500" />
                    )}
                    <span className="text-base">{category}</span>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {Object.values(subGroups).reduce((acc, list) => acc + list.length, 0)} Ürün
                  </span>
                </button>

                {isOpen && (
                  <div className="p-4 space-y-4">
                    {Object.entries(subGroups).map(([subCategory, items]) => (
                      <div key={subCategory} className="space-y-2">
                        {subCategory !== "Genel" && (
                          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700 pl-1">
                            {subCategory}
                          </h3>
                        )}

                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                            <thead className="bg-slate-50 font-semibold text-slate-600">
                              <tr>
                                <th className="px-4 py-2.5">Ürün Adı</th>
                                <th className="px-3 py-2.5 text-center">Tür</th>
                                <th className="px-3 py-2.5 text-right">Plan 1 (İlk/Yen.)</th>
                                <th className="px-3 py-2.5 text-right">Plan 2 (İlk/Yen.)</th>
                                <th className="px-3 py-2.5 text-right">Plan 3 (İlk/Yen.)</th>
                                <th className="px-3 py-2.5 text-center">Durum</th>
                                <th className="px-3 py-2.5 text-right">İşlemler</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {items.map((p) => (
                                <tr key={p.id} className={!p.isActive ? "bg-slate-50/60 opacity-60" : ""}>
                                  <td className="px-4 py-2.5 font-medium text-slate-900 max-w-xs truncate">
                                    {p.name}
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span
                                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                                        p.productType === "PLAN_BASED"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-purple-100 text-purple-800"
                                      }`}
                                    >
                                      {p.productType === "PLAN_BASED" ? "Planlı" : "Sabit Fiyat"}
                                    </span>
                                  </td>

                                  {p.productType === "PLAN_BASED" ? (
                                    <>
                                      <td className="px-3 py-2.5 text-right">
                                        <div className="font-semibold text-slate-900">
                                          {formatCurrency(p.plan1FirstYear)}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          {formatCurrency(p.plan1Renewal)}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5 text-right">
                                        <div className="font-semibold text-slate-900">
                                          {formatCurrency(p.plan2FirstYear)}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          {formatCurrency(p.plan2Renewal)}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2.5 text-right">
                                        <div className="font-semibold text-slate-900">
                                          {formatCurrency(p.plan3FirstYear)}
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          {formatCurrency(p.plan3Renewal)}
                                        </div>
                                      </td>
                                    </>
                                  ) : (
                                    <td colSpan={3} className="px-3 py-2.5 text-center font-bold text-slate-900">
                                      {formatCurrency(p.fixedPrice)}
                                    </td>
                                  )}

                                  <td className="px-3 py-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleActive(p)}
                                      className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                                      title={p.isActive ? "Pasif Yap" : "Aktif Yap"}
                                    >
                                      {p.isActive ? (
                                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          Aktif
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-[11px]">
                                          <XCircle className="h-3.5 w-3.5" />
                                          Pasif
                                        </span>
                                      )}
                                    </button>
                                  </td>

                                  <td className="px-3 py-2.5 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEdit(p)}
                                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-700"
                                        title="Düzenle"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDelete(p)}
                                        className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-700"
                                        title="Sil"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              {editingProduct ? "Ürünü Düzenle" : "Yeni Ürün Ekle"}
            </h2>

            {modalError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Ürün Adı *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Kategori *</label>
                  <input
                    type="text"
                    required
                    list="catList"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                  <datalist id="catList">
                    {existingCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Alt Kategori</label>
                  <input
                    type="text"
                    list="subCatList"
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                  <datalist id="subCatList">
                    {existingSubCategories.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
              </div>

              {!editingProduct && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Ürün Tipi *</label>
                  <div className="mt-1 flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs text-slate-800">
                      <input
                        type="radio"
                        name="productType"
                        checked={formData.productType === "PLAN_BASED"}
                        onChange={() => setFormData({ ...formData, productType: "PLAN_BASED" })}
                      />
                      Plan Bazlı (Plan 1 / 2 / 3)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-800">
                      <input
                        type="radio"
                        name="productType"
                        checked={formData.productType === "FIXED"}
                        onChange={() => setFormData({ ...formData, productType: "FIXED" })}
                      />
                      Sabit Fiyatlı
                    </label>
                  </div>
                </div>
              )}

              {formData.productType === "PLAN_BASED" ? (
                <div className="space-y-3 rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <div className="text-xs font-bold text-slate-700">Plan Fiyatları (₺)</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">Plan 1 - İlk Yıl</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.plan1FirstYear}
                        onChange={(e) => setFormData({ ...formData, plan1FirstYear: e.target.value })}
                        className="mt-0.5 block w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">Plan 1 - Yenileme</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.plan1Renewal}
                        onChange={(e) => setFormData({ ...formData, plan1Renewal: e.target.value })}
                        className="mt-0.5 block w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">Plan 2 - İlk Yıl</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.plan2FirstYear}
                        onChange={(e) => setFormData({ ...formData, plan2FirstYear: e.target.value })}
                        className="mt-0.5 block w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">Plan 2 - Yenileme</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.plan2Renewal}
                        onChange={(e) => setFormData({ ...formData, plan2Renewal: e.target.value })}
                        className="mt-0.5 block w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">Plan 3 - İlk Yıl</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.plan3FirstYear}
                        onChange={(e) => setFormData({ ...formData, plan3FirstYear: e.target.value })}
                        className="mt-0.5 block w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600">Plan 3 - Yenileme</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.plan3Renewal}
                        onChange={(e) => setFormData({ ...formData, plan3Renewal: e.target.value })}
                        className="mt-0.5 block w-full rounded border border-slate-300 p-1.5 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Sabit Fiyat (₺) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.fixedPrice}
                    onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-xs focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700">
                  Ürün Aktif (Teklif oluştururken seçilebilir)
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
