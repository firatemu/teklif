import Link from "next/link";
import { getSession } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import { FileText, Layers, Package, PlusCircle, Settings } from "lucide-react";

export default async function Navbar() {
  const session = await getSession();
  if (!session) return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-700 font-bold text-white shadow-xs">
              AZ
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900">AzemTeklif</span>
              <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Logo Fiyat & Teklif Portalı
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <FileText className="h-4 w-4 text-slate-500" />
              Teklifler
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Package className="h-4 w-4 text-slate-500" />
              Ürün Kataloğu
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Settings className="h-4 w-4 text-slate-500" />
              Ayarlar
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <Link
              href="/quotes/classic/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-white border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5 text-blue-600" />
              Klasik Teklif
            </Link>
            <Link
              href="/quotes/plan-comparison/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 transition-colors"
            >
              <Layers className="h-3.5 w-3.5" />
              Plan Karşılaştırmalı
            </Link>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
            <span className="hidden sm:inline-block text-xs font-medium text-slate-600">
              {session.username}
            </span>
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
