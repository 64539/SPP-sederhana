"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { formatRupiah, formatTanggal, cleanPetugasName } from "@/lib/utils";
import {
  Printer,
  Filter,
  School,
  RotateCcw,
} from "lucide-react";

interface TransaksiLaporan {
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
    jurusan: { namaJurusan: string };
  };
  petugas: { namaLengkap: string };
}

interface Kelas {
  id: number;
  namaKelas: string;
}

export default function LaporanPage() {
  const [transaksi, setTransaksi] = useState<TransaksiLaporan[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [totalNominal, setTotalNominal] = useState(0);
  const [totalTransaksi, setTotalTransaksi] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [tahun, setTahun] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (kelasId) params.append("kelasId", kelasId);
      if (tahun) params.append("tahun", tahun);

      const [lapRes, kRes] = await Promise.all([
        fetch(`/api/laporan?${params.toString()}`),
        fetch("/api/kelas"),
      ]);

      const lapData = await lapRes.json();
      const kData = await kRes.json();

      setTransaksi(lapData.transaksi || []);
      setTotalNominal(lapData.totalNominal || 0);
      setTotalTransaksi(lapData.totalTransaksi || 0);
      if (Array.isArray(kData)) setKelasList(kData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const periodeKeterangan = [
    startDate && endDate ? `${formatTanggal(startDate)} s/d ${formatTanggal(endDate)}` : null,
    kelasId ? `Kelas: ${kelasList.find((k) => k.id === parseInt(kelasId))?.namaKelas || kelasId}` : null,
    tahun ? `Tahun SPP: ${tahun}` : null,
  ].filter(Boolean).join(" • ") || "Semua Periode & Transaksi";

  return (
    <div className="flex min-h-screen bg-slate-50 print:bg-white">
      {/* Hide Sidebar & Navbar when printing */}
      <div className="print:hidden">
        <Sidebar role="ADMIN" userName="Administrator" />
      </div>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="print:hidden">
          <Navbar
            title="Laporan Pembayaran SPP"
            subtitle="Rekapitulasi transaksi pembayaran kas SPP sekolah"
            userName="Administrator"
            role="ADMIN"
          />
        </div>

        <div className="w-full max-w-7xl mx-auto px-6 py-6 space-y-6 print:p-0 print:max-w-none">
          {/* Header Action Bar & Filter (Hidden in Print) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3 print:hidden">
            <div className="flex flex-wrap md:flex-nowrap items-end gap-3">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Kelas
                </label>
                <select
                  value={kelasId}
                  onChange={(e) => setKelasId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                >
                  <option value="">Semua Kelas</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.namaKelas}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[110px]">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Tahun SPP
                </label>
                <input
                  type="text"
                  placeholder="Semua"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-600 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setKelasId("");
                    setTahun("");
                    setTimeout(loadData, 50);
                  }}
                  title="Reset Filter"
                  className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={loadData}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Terapkan Filter
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-800 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>Cetak / Ekspor PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Printable Report Document (Kertas Formal) */}
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-xs space-y-6 print:border-none print:shadow-none print:p-0">
            {/* Kop Surat Sekolah */}
            <div className="border-b-2 border-slate-900 pb-4 text-center flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-600 text-white flex items-center justify-center print:border print:border-slate-800 shrink-0">
                <School className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase leading-snug">
                  SMK NEGERI 1 KOTA
                </h2>
                <p className="text-xs text-slate-600">
                  Jl. Pendidikan No. 100, Telepon (021) 123456 • Website: smkn1.sch.id
                </p>
                <p className="text-xs font-bold text-slate-900 mt-1 uppercase tracking-wider">
                  LAPORAN REKAPITULASI PEMBAYARAN SPP SISWA
                </p>
              </div>
            </div>

            {/* Subjudul Periode Filter */}
            <div className="flex items-center justify-between text-xs text-slate-600 border-b border-slate-100 pb-2">
              <span><strong>Periode / Kriteria:</strong> {periodeKeterangan}</span>
              <span><strong>Total:</strong> {totalTransaksi} Transaksi</span>
            </div>

            {/* Transaction Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 print:bg-slate-100 font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200">
                    <th className="py-2 px-3 border border-slate-200">No</th>
                    <th className="py-2 px-3 border border-slate-200">Tanggal</th>
                    <th className="py-2 px-3 border border-slate-200">NISN</th>
                    <th className="py-2 px-3 border border-slate-200">Nama Siswa</th>
                    <th className="py-2 px-3 border border-slate-200">Kelas</th>
                    <th className="py-2 px-3 border border-slate-200">Bulan SPP</th>
                    <th className="py-2 px-3 border border-slate-200">Nominal</th>
                    <th className="py-2 px-3 border border-slate-200">Petugas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        Memuat data laporan...
                      </td>
                    </tr>
                  ) : transaksi.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400">
                        Tidak ada transaksi pada periode ini
                      </td>
                    </tr>
                  ) : (
                    transaksi.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 border border-slate-200 text-slate-500 text-center">{idx + 1}</td>
                        <td className="py-2 px-3 border border-slate-200">{formatTanggal(t.tanggalBayar)}</td>
                        <td className="py-2 px-3 border border-slate-200 font-mono">{t.siswa.nisn}</td>
                        <td className="py-2 px-3 border border-slate-200 font-semibold text-slate-900">
                          {t.siswa.nama}
                        </td>
                        <td className="py-2 px-3 border border-slate-200">{t.siswa.kelas.namaKelas}</td>
                        <td className="py-2 px-3 border border-slate-200 font-medium">
                          {t.bulanDibayar} {t.tahunDibayar}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 font-semibold text-slate-900">
                          {formatRupiah(t.nominal)}
                        </td>
                        <td className="py-2 px-3 border border-slate-200 text-slate-600">
                          {cleanPetugasName(t.petugas.namaLengkap)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-800 font-bold bg-slate-50 print:bg-slate-100">
                    <td colSpan={6} className="py-2.5 px-3 border border-slate-200 text-right uppercase">
                      Total Pemasukan Kas:
                    </td>
                    <td colSpan={2} className="py-2.5 px-3 border border-slate-200 text-slate-900 text-sm">
                      {formatRupiah(totalNominal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Signature Section for Print */}
            <div className="pt-10 grid grid-cols-2 text-center text-xs text-slate-800">
              <div>
                <p className="text-slate-500">Mengetahui,</p>
                <p className="font-bold">Kepala Sekolah</p>
                <div className="h-16" />
                <p className="font-bold underline">Drs. H. Mulyadi, M.Pd</p>
                <p className="text-slate-500">NIP. 19750812 200003 1 002</p>
              </div>

              <div>
                <p className="text-slate-500">Dicetak pada: {formatTanggal(new Date())}</p>
                <p className="font-bold">Bendahara / Petugas TU</p>
                <div className="h-16" />
                <p className="font-bold underline">Administrator SPP</p>
                <p className="text-slate-500">Sistem Informasi SPP Online</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
