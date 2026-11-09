"use client";

import { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { formatRupiah, formatTanggal, cleanPetugasName, DAFTAR_BULAN } from "@/lib/utils";
import {
  Search,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Printer,
  Calendar,
  User,
  RotateCcw,
} from "lucide-react";

interface SiswaItem {
  id: number;
  nisn: string;
  nis: string;
  nama: string;
  kelas: { namaKelas: string };
  jurusan: { namaJurusan: string };
  spp: { id: number; tahun: number; nominal: number } | null;
}

interface TransaksiItem {
  id: number;
  bulanDibayar: string;
  tahunDibayar: string;
  nominal: number;
  tanggalBayar: string;
  keterangan: string;
  siswa: {
    nama: string;
    nisn: string;
    nis: string;
    kelas: { namaKelas: string };
  };
  petugas: { namaLengkap: string };
}

export default function PetugasTransaksiPage() {
  const [siswaList, setSiswaList] = useState<SiswaItem[]>([]);
  const [selectedSiswaId, setSelectedSiswaId] = useState<number | null>(null);
  const [selectedTahun, setSelectedTahun] = useState<string>("2024");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<TransaksiItem[]>([]);
  const [kwitansi, setKwitansi] = useState<TransaksiItem | null>(null);
  const [userName, setUserName] = useState("Petugas");

  const loadData = async () => {
    setLoading(true);
    try {
      const [meRes, siswaRes, trxRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/siswa"),
        fetch("/api/pembayaran"),
      ]);
      const meData = await meRes.json();
      if (meData.user) setUserName(meData.user.namaLengkap);

      const siswaData = await siswaRes.json();
      const trxData = await trxRes.json();

      if (Array.isArray(siswaData)) {
        setSiswaList(siswaData);
        if (siswaData.length > 0 && !selectedSiswaId) {
          setSelectedSiswaId(siswaData[0].id);
          if (siswaData[0].spp) {
            setSelectedTahun(String(siswaData[0].spp.tahun));
          }
        }
      }

      if (Array.isArray(trxData)) {
        setRecentTransactions(trxData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedSiswa = useMemo(() => {
    return siswaList.find((s) => s.id === selectedSiswaId) || null;
  }, [siswaList, selectedSiswaId]);

  const paidMonthsMap = useMemo(() => {
    if (!selectedSiswa) return new Map();
    const map = new Map<string, TransaksiItem>();
    recentTransactions
      .filter(
        (t) =>
          t.siswa.nisn === selectedSiswa.nisn &&
          t.tahunDibayar === selectedTahun
      )
      .forEach((t) => {
        map.set(t.bulanDibayar, t);
      });
    return map;
  }, [selectedSiswa, recentTransactions, selectedTahun]);

  const toggleMonth = (bulan: string) => {
    if (paidMonthsMap.has(bulan)) return;
    setSelectedMonths((prev) =>
      prev.includes(bulan) ? prev.filter((m) => m !== bulan) : [...prev, bulan]
    );
  };

  const handleBayar = async () => {
    if (!selectedSiswa || selectedMonths.length === 0) return;
    if (!selectedSiswa.spp) {
      setMessage({ type: "error", text: "Siswa ini belum memiliki tarif SPP" });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      let lastSuccess: TransaksiItem | null = null;
      for (const bulan of selectedMonths) {
        const res = await fetch("/api/pembayaran", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siswaId: selectedSiswa.id,
            bulanDibayar: bulan,
            tahunDibayar: selectedTahun,
            sppId: selectedSiswa.spp.id,
            nominal: selectedSiswa.spp.nominal,
            keterangan: `Pembayaran SPP Bulan ${bulan} ${selectedTahun}`,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Gagal memproses pembayaran");
        }
        lastSuccess = data;
      }

      setMessage({
        type: "success",
        text: `Berhasil memproses pembayaran ${selectedMonths.length} bulan untuk ${selectedSiswa.nama}`,
      });
      setSelectedMonths([]);
      if (lastSuccess) {
        setKwitansi(lastSuccess);
      }
      await loadData();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSiswaList = useMemo(() => {
    if (!searchQuery) return siswaList;
    const q = searchQuery.toLowerCase();
    return siswaList.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        s.nis.includes(q) ||
        s.kelas.namaKelas.toLowerCase().includes(q)
    );
  }, [siswaList, searchQuery]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="PETUGAS" userName={userName} />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Entri Transaksi Pembayaran"
          subtitle="Proses pembayaran SPP siswa dan cetak bukti kwitansi resmi"
          userName={userName}
          role="PETUGAS"
        />

        <div className="w-full max-w-7xl mx-auto px-6 py-6 space-y-6">
          {message && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 border ${
                message.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}

          {/* Form Transaksi Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Cari & Pilih Siswa */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">Cari Data Siswa</h3>
                  <span className="text-xs text-slate-400 font-medium">
                    {filteredSiswaList.length} siswa
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik nama atau NISN..."
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                  {filteredSiswaList.map((siswa) => {
                    const isSelected = siswa.id === selectedSiswaId;
                    return (
                      <button
                        key={siswa.id}
                        type="button"
                        onClick={() => {
                          setSelectedSiswaId(siswa.id);
                          if (siswa.spp) setSelectedTahun(String(siswa.spp.tahun));
                          setSelectedMonths([]);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-emerald-50/80 border border-emerald-200"
                            : "hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              isSelected ? "text-emerald-900" : "text-slate-800"
                            }`}
                          >
                            {siswa.nama}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            NISN: <span className="font-mono">{siswa.nisn}</span> •{" "}
                            {siswa.kelas.namaKelas}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200/60 shadow-xs">
                          {siswa.jurusan.namaJurusan.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedSiswa && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{selectedSiswa.nama}</h4>
                      <p className="text-xs text-slate-500 font-mono">NISN: {selectedSiswa.nisn}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block">Kelas:</span>
                      <span className="font-semibold text-slate-700">
                        {selectedSiswa.kelas.namaKelas}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Tarif SPP:</span>
                      <span className="font-semibold text-emerald-600">
                        {selectedSiswa.spp
                          ? formatRupiah(selectedSiswa.spp.nominal)
                          : "Belum diset"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Matriks Bulan & Pembayaran */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Matriks Bulan Tagihan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Pilih bulan yang dibayar oleh siswa
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500">Tahun:</label>
                    <select
                      value={selectedTahun}
                      onChange={(e) => {
                        setSelectedTahun(e.target.value);
                        setSelectedMonths([]);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="2023">2023</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                      <option value="2026">2026</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {DAFTAR_BULAN.map((bulan) => {
                    const isPaid = paidMonthsMap.has(bulan);
                    const isSelected = selectedMonths.includes(bulan);
                    const paidTrx = paidMonthsMap.get(bulan);

                    return (
                      <button
                        key={bulan}
                        type="button"
                        onClick={() => toggleMonth(bulan)}
                        disabled={isPaid}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          isPaid
                            ? "bg-emerald-50/70 border-emerald-200 cursor-not-allowed text-emerald-900"
                            : isSelected
                            ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-500/20"
                            : "bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm">{bulan}</span>
                          {isPaid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                isSelected
                                  ? "bg-white text-emerald-600 border-white font-bold"
                                  : "border-slate-300"
                              }`}
                            >
                              {isSelected && "✓"}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs ${
                            isPaid
                              ? "text-emerald-700"
                              : isSelected
                              ? "text-emerald-100"
                              : "text-slate-500"
                          }`}
                        >
                          {isPaid
                            ? `Lunas (${formatTanggal(paidTrx?.tanggalBayar || new Date())})`
                            : selectedSiswa?.spp
                            ? formatRupiah(selectedSiswa.spp.nominal)
                            : "Belum diset"}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Bulan dipilih:</span>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedMonths.length === 0
                        ? "Belum ada bulan yang dipilih"
                        : `${selectedMonths.join(", ")} (${selectedMonths.length} bulan)`}
                    </p>
                    <p className="text-xs font-semibold text-emerald-700 mt-1">
                      Total Tagihan:{" "}
                      <span className="text-base font-bold">
                        {formatRupiah(
                          (selectedSiswa?.spp?.nominal || 0) * selectedMonths.length
                        )}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBayar}
                    disabled={selectedMonths.length === 0 || submitting || !selectedSiswa}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>{submitting ? "Memproses..." : "Konfirmasi Pembayaran"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Kwitansi Modal */}
          {kwitansi && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
              <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-slate-200 space-y-6">
                <div className="text-center border-b border-dashed border-slate-200 pb-5">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Bukti Pembayaran SPP</h3>
                  <p className="text-xs text-slate-500">SMK Negeri 1 (UKK RPL 2026)</p>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">No. Bukti:</span>
                    <span className="font-mono font-semibold text-slate-800">
                      SPP-{kwitansi.id.toString().padStart(5, "0")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Waktu Bayar:</span>
                    <span className="font-semibold text-slate-800">
                      {formatTanggal(kwitansi.tanggalBayar)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nama Siswa:</span>
                    <span className="font-bold text-slate-900">{kwitansi.siswa.nama}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">NISN / Kelas:</span>
                    <span>
                      {kwitansi.siswa.nisn} / {kwitansi.siswa.kelas.namaKelas}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bulan:</span>
                    <span className="font-semibold text-blue-700">
                      {kwitansi.bulanDibayar} {kwitansi.tahunDibayar}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
                    <span className="font-bold text-slate-900">Jumlah Dibayar:</span>
                    <span className="font-bold text-slate-900 text-base">
                      {formatRupiah(kwitansi.nominal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Petugas Kasir:</span>
                    <span className="font-medium text-slate-700">
                      {cleanPetugasName(kwitansi.petugas.namaLengkap)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span>Cetak Struk</span>
                  </button>
                  <button
                    onClick={() => setKwitansi(null)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700"
                  >
                    Selesai
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
