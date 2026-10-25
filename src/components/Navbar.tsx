import Link from "next/link";
import { getSession } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import {
  FileText,
  Package,
  Settings,
  PlusCircle,
  Layers,
  Menu,
  X,
  ChevronDown,
  Receipt,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Teklifler", icon: FileText },
  { href: "/receipts", label: "Tahsilat Makbuzları", icon: Receipt },
  { href: "/products", label: "Ürün Kataloğu", icon: Package },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export default async function Navbar() {
  const session = await getSession();
  if (!session) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-800 text-sm font-bold tracking-tight text-white shadow-sm transition-transform group-hover:scale-105">
            AZ
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[15px] font-bold tracking-tight text-slate-900">
              AzemTeklif
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Logo Fiyat Portalı
            </span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <Icon className="h-4 w-4 text-slate-400" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex-1" />

        <div className="hidden items-center gap-2 sm:flex">
          <Link href="/quotes/classic/new" className="btn btn-secondary btn-sm">
            <PlusCircle className="h-4 w-4 text-slate-400" />
            Klasik Teklif
          </Link>
          <Link href="/quotes/plan-comparison/new" className="btn btn-primary btn-sm">
            <Layers className="h-4 w-4" />
            Plan Karşılaştırmalı
          </Link>
        </div>

        <details className="relative sm:hidden">
          <summary className="btn btn-primary btn-sm list-none">
            <PlusCircle className="h-4 w-4" />
            Yeni
            <ChevronDown className="h-3.5 w-3.5 opacity-80" />
          </summary>
          <div className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <Link
              href="/quotes/classic/new"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileText className="h-4 w-4 text-slate-400" />
              Klasik Teklif
            </Link>
            <Link
              href="/quotes/plan-comparison/new"
              className="flex items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Layers className="h-4 w-4 text-slate-400" />
              Plan Karşılaştırmalı
            </Link>
          </div>
        </details>

        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
          <span className="hidden text-sm font-medium text-slate-600 md:inline">
            {session.username}
          </span>
          <LogoutButton />
        </div>

        <details className="group lg:hidden">
          <summary className="icon-btn list-none">
            <Menu className="h-5 w-5 group-open:hidden" />
            <X className="hidden h-5 w-5 group-open:block" />
          </summary>
          <div className="fixed inset-x-0 top-16 z-40 border-b border-slate-200 bg-white p-3 shadow-lg">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Icon className="h-4 w-4 text-slate-400" />
                {label}
              </Link>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}