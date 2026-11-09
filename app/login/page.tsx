"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { School, Lock, User, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Gagal masuk ke sistem");
        setLoading(false);
        return;
      }

      router.push(data.redirectUrl);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Logo & Header */}
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <School className="w-6 h-6" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-xl font-bold tracking-tight text-slate-900">
          Aplikasi Pembayaran SPP
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Sistem Informasi Pengelolaan SPP Siswa SMK (UKK RPL)
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-7 px-6 sm:px-8 border border-slate-200 rounded-xl shadow-xs">
          {error && (
            <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {loading ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Section for Examiner / Testing */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-medium text-slate-500 text-center mb-2.5">
              Akun Uji Coba Cepat (UKK)
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("admin", "admin123")}
                className="text-xs py-1.5 px-3 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                Demo Admin
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("petugas", "petugas123")}
                className="text-xs py-1.5 px-3 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                Demo Petugas
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("siswa", "siswa123")}
                className="text-xs py-1.5 px-3 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                Demo Siswa
              </button>
            </div>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Uji Kompetensi Keahlian (UKK) Rekayasa Perangkat Lunak
        </p>
      </div>
    </div>
  );
}
