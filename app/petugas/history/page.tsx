"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { formatRupiah, formatTanggal, formatWaktu, cleanPetugasName } from "@/lib/utils";
import { History, Printer, Search, RotateCcw, CheckCircle2 } from "lucide-react";

interface Transaksi {
  id: number;
  tanggalBayar: string;
  bulanDibayar: string;
  tahunDibayar: string;
  nominal: number;
  keterangan: string;
  siswa: {
    nama: string;
    nisn: string;
    nis: string;
    kelas: { namaKelas: string };
  };
  petugas: { namaLengkap: string };
}

export default function PetugasHistoryPage() {
  const [list, setList] = useState<Transaksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTrx, setSelectedTrx] = useState<Transaksi | null>(null);
  const [userName, setUserName] = useState("Petugas Kasir");

  const loadData = async () => {
    setLoading(true);
    try {
      const [meRes, res] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/pembayaran"),
      ]);
      const me = await meRes.json();
      if (me.user) setUserName(me.user.namaLengkap);

      const data = await res.json();
      if (Array.isArray(data)) setList(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = list.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.siswa.nama.toLowerCase().includes(q) ||
      t.siswa.nisn.includes(q) ||
      t.bulanDibayar.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PETUGAS" userName={userName} />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="History Pembayaran SPP"
          subtitle="Catatan riwayat transaksi seluruh siswa yang telah diproses"
          userName={userName}
          role="PETUGAS"
        />

        <div className="w-full max-w-7xl mx-auto px-6 py-6 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari siswa atau NISN..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
            <button
              onClick={loadData}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Waktu Bayar</th>
                    <th className="py-3.5 px-6">Nama Siswa</th>
                    <th className="py-3.5 px-6">Kelas</th>
                    <th className="py-3.5 px-6">Bulan SPP</th>
                    <th className="py-3.5 px-6">Nominal</th>
                    <th className="py-3.5 px-6">Petugas</th>
                    <th className="py-3.5 px-6 text-center">Cetak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Memuat data riwayat...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada riwayat pembayaran ditemukan
                      </td>
                    </tr>
                  ) : (
                    filtered.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6 text-xs text-slate-500">
                          {formatWaktu(t.tanggalBayar)}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {t.siswa.nama}
                          <span className="block text-xs font-mono text-slate-400">
                            {t.siswa.nisn}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-xs font-medium text-slate-700">
                          {t.siswa.kelas.namaKelas}
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-800">
                          {t.bulanDibayar} {t.tahunDibayar}
                        </td>
                        <td className="py-4 px-6 font-bold text-emerald-600">
                          {formatRupiah(t.nominal)}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-600">
                          {cleanPetugasName(t.petugas.namaLengkap)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => setSelectedTrx(t)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Cetak Kwitansi"
                          >
                            <Printer className="w-4 h-4" />
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
                <h3 className="text-base font-bold text-slate-900">Bukti Pembayaran SPP</h3>
                <p className="text-xs text-slate-500">SMK Negeri 1 (UKK RPL 2026)</p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">No. Transaksi:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    SPP-{selectedTrx.id.toString().padStart(5, "0")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tanggal Bayar:</span>
                  <span className="font-semibold text-slate-800">
                    {formatTanggal(selectedTrx.tanggalBayar)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nama Siswa:</span>
                  <span className="font-bold text-slate-900">{selectedTrx.siswa.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">NISN / Kelas:</span>
                  <span>
                    {selectedTrx.siswa.nisn} / {selectedTrx.siswa.kelas.namaKelas}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bulan Dibayar:</span>
                  <span className="font-semibold text-blue-700">
                    {selectedTrx.bulanDibayar} {selectedTrx.tahunDibayar}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
                  <span className="font-bold text-slate-900">Total Nominal:</span>
                  <span className="font-bold text-slate-900">
                    {formatRupiah(selectedTrx.nominal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Petugas Penerima:</span>
                  <span className="font-medium text-slate-700">
                    {cleanPetugasName(selectedTrx.petugas.namaLengkap)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 text-slate-700 font-medium text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cetak Struk</span>
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
