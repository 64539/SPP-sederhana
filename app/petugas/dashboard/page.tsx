"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { StatCard } from "@/components/Card";
import { formatRupiah, formatWaktu, cleanPetugasName } from "@/lib/utils";
import { PlusCircle, CheckCircle2, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface DashboardData {
  user: { id: number; namaLengkap: string; role: "PETUGAS" };
  stats: {
    totalDiprosesSaya: number;
    nominalDiprosesSaya: number;
    totalSemuaTransaksi: number;
  };
  recentTransaksi: Array<{
    id: number;
    tanggalBayar: string;
    bulanDibayar: string;
    tahunDibayar: string;
    nominal: number;
    siswa: { nama: string; nisn: string; kelas: { namaKelas: string } };
    petugas: { id: number; namaLengkap: string };
  }>;
}

export default function PetugasDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, bayarRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/pembayaran"),
        ]);

        const me = await meRes.json();
        const pembayaran = await bayarRes.json();
        const bayarList = Array.isArray(pembayaran) ? pembayaran : [];

        const myTrx = bayarList.filter((b) => b.petugas?.id === me.user?.id);
        const myTotalNominal = myTrx.reduce(
          (sum: number, item: { nominal: number }) => sum + item.nominal,
          0
        );

        setData({
          user: me.user || { id: 0, namaLengkap: "Petugas Kasir", role: "PETUGAS" },
          stats: {
            totalDiprosesSaya: myTrx.length,
            nominalDiprosesSaya: myTotalNominal,
            totalSemuaTransaksi: bayarList.length,
          },
          recentTransaksi: bayarList.slice(0, 6),
        });
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PETUGAS" userName={data?.user.namaLengkap || "Petugas Kasir"} />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Dashboard Petugas Kasir"
          subtitle="Panel entri pembayaran dan pencatatan kas SPP siswa"
          userName={data?.user.namaLengkap || "Petugas Kasir"}
          role="PETUGAS"
        />

        <div className="w-full max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Dashboard Petugas Kasir
              </h2>
              <p className="text-xs text-slate-500">
                Operator loket pelayanan SPP aktif
              </p>
            </div>
            <Link
              href="/petugas/transaksi"
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Entri Pembayaran Baru</span>
            </Link>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Transaksi Diproses Saya"
              value={loading ? "..." : data?.stats.totalDiprosesSaya || 0}
            />
            <StatCard
              title="Kas Dihimpun Saya"
              value={loading ? "..." : formatRupiah(data?.stats.nominalDiprosesSaya || 0)}
            />
            <StatCard
              title="Total Seluruh Transaksi"
              value={loading ? "..." : data?.stats.totalSemuaTransaksi || 0}
            />
          </div>

          {/* Recent Transactions Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Aktivitas Transaksi SPP Terkini
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar transaksi pembayaran yang baru saja diproses di sistem
                </p>
              </div>
              <Link
                href="/petugas/history"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
              >
                <span>Lihat History</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Waktu Bayar</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">Bulan Dibayar</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">Petugas</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Memuat data transaksi...
                      </td>
                    </tr>
                  ) : !data?.recentTransaksi || data.recentTransaksi.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada transaksi pembayaran
                      </td>
                    </tr>
                  ) : (
                    data.recentTransaksi.map((trx) => (
                      <tr key={trx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {formatWaktu(trx.tanggalBayar)}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {trx.siswa.nama}
                          <span className="block text-xs font-mono text-slate-400">
                            NISN: {trx.siswa.nisn}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            {trx.siswa.kelas.namaKelas}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {trx.bulanDibayar} {trx.tahunDibayar}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {formatRupiah(trx.nominal)}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {cleanPetugasName(trx.petugas.namaLengkap)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Lunas
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
