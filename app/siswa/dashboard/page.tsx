"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { formatRupiah, formatTanggal, formatWaktu, cleanPetugasName, DAFTAR_BULAN } from "@/lib/utils";
import { CheckCircle2, Clock, Printer } from "lucide-react";

interface SiswaProfile {
  id: number;
  nama: string;
  nisn: string;
  nis: string;
  alamat: string | null;
  noTelp: string | null;
  kelas: { namaKelas: string };
  jurusan: { namaJurusan: string };
  spp: { tahun: number; nominal: number } | null;
  pembayaran: Array<{
    id: number;
    tanggalBayar: string;
    bulanDibayar: string;
    tahunDibayar: string;
    nominal: number;
    keterangan?: string;
    petugas: { namaLengkap: string };
  }>;
}

export default function SiswaDashboard() {
  const [profile, setProfile] = useState<SiswaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrx, setSelectedTrx] = useState<SiswaProfile["pembayaran"][0] | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, bayarRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/pembayaran"),
        ]);
        const me = await meRes.json();
        const payments = await bayarRes.json();

        if (me.user?.siswaId) {
          const res = await fetch("/api/siswa");
          const siswaList = await res.json();
          if (Array.isArray(siswaList)) {
            const found = siswaList.find((s) => s.id === me.user.siswaId);
            if (found) {
              setProfile({
                ...found,
                pembayaran: Array.isArray(payments) ? payments : [],
              });
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const bayarSet = new Set(
    (profile?.pembayaran || []).map((p) => p.bulanDibayar.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="SISWA" userName={profile?.nama || "Siswa"} />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Portal Pembayaran SPP"
          subtitle="Informasi status pembayaran SPP dan biodata siswa"
          userName={profile?.nama || "Siswa"}
          role="SISWA"
        />

        <div className="w-full max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Ringkasan Biodata & Tarif SPP (Satu Baris Ringkas) */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-base">
                  {profile?.nama ? profile.nama.charAt(0) : "S"}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    {profile?.nama || (loading ? "Memuat..." : "Data Siswa")}
                  </h2>
                  <p className="text-xs text-slate-500">
                    NISN: <span className="font-mono text-slate-700">{profile?.nisn || "-"}</span> • NIS:{" "}
                    <span className="font-mono text-slate-700">{profile?.nis || "-"}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-xs border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <div>
                  <span className="text-slate-400 block">Kelas & Jurusan</span>
                  <span className="font-semibold text-slate-800">
                    {profile?.kelas.namaKelas || "-"} ({profile?.jurusan.namaJurusan || "-"})
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <span className="text-slate-400 block">Tarif SPP Aktif</span>
                  <span className="font-semibold text-slate-900">
                    {profile?.spp ? `${formatRupiah(profile.spp.nominal)} / bln` : "-"}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                <div>
                  <span className="text-slate-400 block">Status Pelunasan</span>
                  <span className="font-semibold text-blue-700">
                    {profile?.pembayaran.length || 0} dari 12 Bulan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Matriks 12 Bulan Ringkas */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Matriks Pembayaran SPP Tahun Ajaran 2024 / 2025
              </h3>
              <span className="text-xs text-slate-500">
                Lunas: {profile?.pembayaran.length || 0} • Belum: {12 - (profile?.pembayaran.length || 0)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
              {DAFTAR_BULAN.map((bulan) => {
                const isLunas = bayarSet.has(bulan.toLowerCase());
                return (
                  <div
                    key={bulan}
                    className={`p-2.5 rounded-lg border text-center transition-colors ${
                      isLunas
                        ? "bg-blue-50 border-blue-200 text-blue-900"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="block text-xs font-semibold leading-tight">{bulan.substring(0, 3)}</span>
                    <span
                      className={`inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        isLunas ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isLunas ? "Lunas" : "Belum"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tabel Riwayat Pembayaran */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Riwayat Pembayaran SPP
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar transaksi yang telah tercatat dan disahkan oleh petugas loket
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">No. Transaksi</th>
                    <th className="py-3 px-4">Tanggal Bayar</th>
                    <th className="py-3 px-4">Bulan SPP</th>
                    <th className="py-3 px-4">Nominal</th>
                    <th className="py-3 px-4">Petugas</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Kwitansi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Memuat data riwayat...
                      </td>
                    </tr>
                  ) : !profile?.pembayaran || profile.pembayaran.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Belum ada riwayat pembayaran yang tercatat
                      </td>
                    </tr>
                  ) : (
                    profile.pembayaran.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-800">
                          SPP-{t.id.toString().padStart(5, "0")}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {formatWaktu(t.tanggalBayar)}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {t.bulanDibayar} {t.tahunDibayar}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {formatRupiah(t.nominal)}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600">
                          {cleanPetugasName(t.petugas?.namaLengkap)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            Lunas
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedTrx(t)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-md transition-colors border border-blue-100"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Cetak</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Kwitansi */}
        {selectedTrx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
              <div className="text-center border-b border-dashed border-slate-200 pb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-blue-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Kwitansi Pembayaran SPP</h3>
                <p className="text-xs text-slate-500">SMK Negeri 1 (Dokumen Sah Pembayaran)</p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nomor Transaksi:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    SPP-{selectedTrx.id.toString().padStart(5, "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal Transaksi:</span>
                  <span className="font-semibold text-slate-800">
                    {formatTanggal(selectedTrx.tanggalBayar)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Siswa:</span>
                  <span className="font-bold text-slate-900">{profile?.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">NISN / Kelas:</span>
                  <span>
                    {profile?.nisn} / {profile?.kelas.namaKelas}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bulan SPP:</span>
                  <span className="font-semibold text-blue-700">
                    {selectedTrx.bulanDibayar} {selectedTrx.tahunDibayar}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
                  <span className="font-bold text-slate-900">Nominal Lunas:</span>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(selectedTrx.nominal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Petugas Loket:</span>
                  <span className="font-medium text-slate-700">
                    {cleanPetugasName(selectedTrx.petugas?.namaLengkap)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cetak</span>
                </button>
                <button
                  onClick={() => setSelectedTrx(null)}
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
