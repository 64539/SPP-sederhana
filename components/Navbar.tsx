"use client";

import { User } from "lucide-react";

interface NavbarProps {
  title: string;
  subtitle?: string;
  userName: string;
  role: string;
}

export default function Navbar({ title, subtitle, userName, role }: NavbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="w-full max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-xs border border-blue-200">
            {userName ? userName.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{userName}</p>
            <p className="text-[11px] text-slate-500 capitalize">{role.toLowerCase()}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
