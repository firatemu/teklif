"use client";

import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/formatters";
import {
  Package, Search, Plus, Edit2, Trash2, CheckCircle2,
  XCircle, ChevronDown, ChevronRight, X, Layers, Tag,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { EmptyState, TableSkeleton, Alert } from "@/components/ui/States";

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

const EMPTY_FORM = {
  name: "", category: "", subCategory: "",
  productType: "PLAN_BASED" as "PLAN_BASED" | "FIXED",
  plan1FirstYear: "", plan1Renewal: "",
  plan2FirstYear: "", plan2Renewal: "",
  plan3FirstYear: "", plan3Renewal: "",
  fixedPrice: "", isActive: true,
};

export default function ProductsPage() {
  const notify = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [modalError, setModalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        const openMap: Record<string, boolean> = {};
        data.forEach((p: Product) => {
          openMap[p.category] = true;
        });
        setOpenCategories(openMap);
      }
    } catch {
      notify.error("Bağlantı hatasi", "Urunler yuklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCategory = (cat: string) =>
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ ...EMPTY_FORM });
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
        setModalError(data.error || "Islem sirasinda hata olustu.");
        return;
      }
      setIsModalOpen(false);
      notify.success(
        editingProduct ? "Urun guncellendi" : "Urun eklendi",
        formData.name
      );
      fetchProducts();
    } catch {
      setModalError("Baglanti hatasi olustu.");
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
        notify.success(p.isActive ? "Urun pasif yapildi" : "Urun aktif yapildi", p.name);
        fetchProducts();
      }
    } catch {
      notify.error("Baglanti hatasi", "Durum guncellenemedi.");
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const p = pendingDelete;
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        notify.error("Silme basarisiz", data.error || "Urun silinemedi.");
        return;
      }
      notify.success("Urun silindi", p.name);
      setPendingDelete(null);
      fetchProducts();
    } catch {
      notify.error("Baglanti hatasi", "Urun silinemedi.");
    }
  };

  const existingCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products]
  );
  const existingSubCategories = useMemo(
    () => Array.from(new Set(products.map((p) => p.subCategory).filter(Boolean))) as string[],
    [products]
  );

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(term))
    );
  }, [products, search]);

  const grouped = useMemo(() => {
    const g: Record<string, Record<string, Product[]>> = {};
    filteredProducts.forEach((p) => {
      if (!g[p.category]) g[p.category] = {};
      const sub = p.subCategory || "Genel";
      if (!g[p.category][sub]) g[p.category][sub] = [];
      g[p.category][sub].push(p);
    });
    return g;
  }, [filteredProducts]);

  const totalCount = Object.values(grouped).reduce(
    (acc, subs) => acc + Object.values(subs).reduce((n, l) => n + l.length, 0),
    0
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Package className="h-6 w-6 text-brand-600" />
            Urun Katalogu
          </h1>
          <p className="page-subtitle">
            Logo Edge T-Series ve diger urun/hizmet fiyat listesi
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative w-full sm:w-64">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              placeholder="Urun veya kategori ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field pl-9 pr-9"
              aria-label="Urun ara"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Aramayi temizle"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button onClick={handleOpenAdd} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            Yeni Urun
          </button>
        </div>
      </div>

      {!loading && (
        <p className="mt-5 text-sm text-slate-500">
          <span className="font-semibold text-slate-700 tabular">{totalCount}</span> urun
          <span className="text-slate-400"> / {products.length} toplam</span>
        </p>
      )}

      {loading ? (
        <div className="surface mt-3 overflow-hidden">
          <TableSkeleton rows={8} cols={5} />
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="surface mt-3">
          <EmptyState
            icon={search ? Search : Package}
            title={search ? "Sonuc bulunamadi" : "Katalog bos"}
            description={
              search
                ? "Arama kriterlerinizi degistirerek tekrar deneyin."
                : "Ilk urununuzu ekleyerek baslayin."
            }
            action={
              search ? (
                <button type="button" onClick={() => setSearch("")} className="btn btn-secondary">
                  Aramayi Temizle
                </button>
              ) : (
                <button type="button" onClick={handleOpenAdd} className="btn btn-primary">
                  <Plus className="h-4 w-4" />
                  Yeni Urun
                </button>
              )
            }
          />
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {Object.entries(grouped).map(([category, subGroups]) => {
            const isOpen = openCategories[category] ?? true;
            const catCount = Object.values(subGroups).reduce(
              (acc, l) => acc + l.length,
              0
            );
            return (
              <div key={category} className="surface overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between bg-slate-50 px-5 py-3.5 text-left transition-colors hover:bg-slate-100"
                >
                  <span className="flex items-center gap-2.5">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                    <span className="text-[15px] font-bold text-slate-900">{category}</span>
                  </span>
                  <span className="badge badge-muted tabular">{catCount} Urun</span>
                </button>

                {isOpen && (
                  <div className="space-y-4 p-4">
                    {Object.entries(subGroups).map(([subCategory, items]) => (
                      <div key={subCategory} className="space-y-2">
                        {subCategory !== "Genel" && (
                          <h3 className="flex items-center gap-1.5 pl-1 text-[11px] font-bold uppercase tracking-wider text-brand-700">
                            <Tag className="h-3 w-3" />
                            {subCategory}
                          </h3>
                        )}
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="min-w-full">
                            <thead className="table-head">
                              <tr>
                                <th scope="col">Urun Adi</th>
                                <th scope="col" className="text-center">Tur</th>
                                <th scope="col" className="text-right">Plan 1</th>
                                <th scope="col" className="text-right">Plan 2</th>
                                <th scope="col" className="text-right">Plan 3</th>
                                <th scope="col" className="text-center">Durum</th>
                                <th scope="col" className="text-right">Islemler</th>
                              </tr>
                            </thead>
                            <tbody className="table-body">
                              {items.map((p) => (
                                <tr
                                  key={p.id}
                                  className={!p.isActive ? "bg-slate-50/60 opacity-65" : ""}
                                >
                                  <td className="max-w-xs truncate font-medium text-slate-900">
                                    {p.name}
                                  </td>
                                  <td className="text-center">
                                    <span
                                      className={`badge ${
                                        p.productType === "PLAN_BASED"
                                          ? "badge-brand"
                                          : "badge-accent"
                                      }`}
                                    >
                                      {p.productType === "PLAN_BASED" ? "Planli" : "Sabit"}
                                    </span>
                                  </td>
                                  {p.productType === "PLAN_BASED" ? (
                                    <>
                                      <td className="text-right tabular">
                                        <div className="font-semibold text-slate-900">
                                          {formatCurrency(p.plan1FirstYear)}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                          {formatCurrency(p.plan1Renewal)}
                                        </div>
                                      </td>
                                      <td className="text-right tabular">
                                        <div className="font-semibold text-slate-900">
                                          {formatCurrency(p.plan2FirstYear)}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                          {formatCurrency(p.plan2Renewal)}
                                        </div>
                                      </td>
                                      <td className="text-right tabular">
                                        <div className="font-semibold text-slate-900">
                                          {formatCurrency(p.plan3FirstYear)}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                          {formatCurrency(p.plan3Renewal)}
                                        </div>
                                      </td>
                                    </>
                                  ) : (
                                    <td className="text-right font-bold text-slate-900 tabular">
                                      {formatCurrency(p.fixedPrice)}
                                    </td>
                                  )}
                                  <td className="text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleActive(p)}
                                      title={p.isActive ? "Pasif Yap" : "Aktif Yap"}
                                      aria-label={p.name + " durum degistir"}
                                    >
                                      {p.isActive ? (
                                        <span className="badge badge-success">
                                          <CheckCircle2 className="h-3 w-3" />
                                          Aktif
                                        </span>
                                      ) : (
                                        <span className="badge badge-muted">
                                          <XCircle className="h-3 w-3" />
                                          Pasif
                                        </span>
                                      )}
                                    </button>
                                  </td>
                                  <td>
                                    <div className="flex items-center justify-end gap-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEdit(p)}
                                        className="icon-btn"
                                        title="Duzenle"
                                        aria-label={p.name + " duzenle"}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPendingDelete(p)}
                                        className="icon-btn icon-btn-danger"
                                        title="Sil"
                                        aria-label={p.name + " sil"}
                                      >
                                        <Trash2 className="h-4 w-4" />
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

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Urunu Duzenle" : "Yeni Urun Ekle"}
        description={
          editingProduct
            ? "Urun bilgilerini guncelleyin."
            : "Katalog'a yeni bir urun veya hizmet ekleyin."
        }
        size="md"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Iptal
            </button>
            <button
              type="submit"
              form="product-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </>
        }
      >
        {modalError && (
          <div className="mb-4">
            <Alert tone="danger">{modalError}</Alert>
          </div>
        )}

        <form id="product-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="field-label">Urun Adi *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="field"
              placeholder="Orn: Logo Edge T-Series Basic"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Kategori *</label>
              <input
                type="text"
                required
                list="catList"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="field"
                placeholder="Orn: Logo Urunleri"
              />
              <datalist id="catList">
                {existingCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="field-label">Alt Kategori</label>
              <input
                type="text"
                list="subCatList"
                value={formData.subCategory}
                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                className="field"
                placeholder="Orn: T-Series"
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
              <label className="field-label">Urun Tipi *</label>
              <div className="mt-1 flex flex-wrap gap-4">
                {(
                  [
                    ["PLAN_BASED", "Plan Bazli (Plan 1 / 2 / 3)"],
                    ["FIXED", "Sabit Fiyatli"],
                  ] as const
                ).map(([val, label]) => (
                  <label
                    key={val}
                    className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="radio"
                      name="productType"
                      checked={formData.productType === val}
                      onChange={() => setFormData({ ...formData, productType: val })}
                      className="h-4 w-4 border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.productType === "PLAN_BASED" ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-slate-700">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                Plan Fiyatlari (TL)
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["plan1FirstYear", "Plan 1 - Ilk Yil"],
                    ["plan1Renewal", "Plan 1 - Yenileme"],
                    ["plan2FirstYear", "Plan 2 - Ilk Yil"],
                    ["plan2Renewal", "Plan 2 - Yenileme"],
                    ["plan3FirstYear", "Plan 3 - Ilk Yil"],
                    ["plan3Renewal", "Plan 3 - Yenileme"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      {label}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData[key]}
                      onChange={(e) =>
                        setFormData({ ...formData, [key]: e.target.value })
                      }
                      className="field tabular"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="field-label">Sabit Fiyat (TL) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.fixedPrice}
                onChange={(e) => setFormData({ ...formData, fixedPrice: e.target.value })}
                className="field tabular"
              />
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              <span className="block text-sm font-semibold text-slate-700">
                Urun Aktif
              </span>
              <span className="block text-xs text-slate-500">
                Aktif urunler teklif olustururken secilebilir.
              </span>
            </span>
          </label>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete !== null}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Urunu sil"
        description={
          pendingDelete
            ? '"' + pendingDelete.name + '" kalici olarak silinecek.'
            : undefined
        }
        confirmLabel="Sil"
      />
    </div>
  );
}
