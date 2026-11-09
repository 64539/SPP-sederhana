"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  UserCheck,
  GraduationCap,
  BadgeDollarSign,
  FileBarChart2,
  History,
  LogOut,
  School,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  role: "ADMIN" | "PETUGAS" | "SISWA";
  userName?: string;
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const adminMenu = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Transaksi SPP", href: "/admin/transaksi", icon: CreditCard },
    { label: "Data Siswa", href: "/admin/siswa", icon: Users },
    { label: "Data Petugas", href: "/admin/petugas", icon: UserCheck },
    { label: "Data Kelas", href: "/admin/kelas", icon: GraduationCap },
    { label: "Tarif SPP", href: "/admin/spp", icon: BadgeDollarSign },
    { label: "Laporan", href: "/admin/laporan", icon: FileBarChart2 },
  ];

  const petugasMenu = [
    { label: "Dashboard", href: "/petugas/dashboard", icon: LayoutDashboard },
    { label: "Entri Pembayaran", href: "/petugas/transaksi", icon: CreditCard },
    { label: "History Pembayaran", href: "/petugas/history", icon: History },
  ];

  const siswaMenu = [
    { label: "Pembayaran SPP", href: "/siswa/dashboard", icon: LayoutDashboard },
  ];

  const menu = role === "ADMIN" ? adminMenu : role === "PETUGAS" ? petugasMenu : siswaMenu;

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <School className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-base leading-tight tracking-tight">
              SPP Mandiri
            </h1>
            <p className="text-xs text-slate-500 font-medium">SMK Negeri 1</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </p>
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-blue-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors border border-transparent"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Sistem</span>
        </button>
      </div>
    </aside>
  );
}
