"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Modal from "@/components/Modal";
import { formatRupiah } from "@/lib/utils";
import {
  BadgeDollarSign,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface Spp {
  id: number;
  tahun: number;
  nominal: number;
  _count: { siswa: number; pembayaran: number };
}

export default function SppPage() {
  const [sppList, setSppList] = useState<Spp[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpp, setEditingSpp] = useState<Spp | null>(null);

  const [tahun, setTahun] = useState("");
  const [nominal, setNominal] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadSpp = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/spp");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSppList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpp();
  }, []);

  const openAddModal = () => {
    setEditingSpp(null);
    setTahun(new Date().getFullYear().toString());
    setNominal("250000");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (s: Spp) => {
    setEditingSpp(s);
    setTahun(s.tahun.toString());
    setNominal(s.nominal.toString());
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        id: editingSpp?.id,
        tahun: Number(tahun),
        nominal: Number(nominal),
      };

      const res = await fetch("/api/spp", {
        method: editingSpp ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan tarif SPP");
      }

      setSuccessMsg(
        editingSpp
          ? "Tarif SPP berhasil diperbarui"
          : "Tarif SPP baru berhasil ditambahkan"
      );
      setModalOpen(false);
      loadSpp();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, th: number) => {
    if (!confirm(`Hapus data tarif SPP tahun ${th}?`)) return;
    try {
      const res = await fetch(`/api/spp?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Tarif SPP berhasil dihapus");
        loadSpp();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert(data.error || "Gagal menghapus tarif SPP");
      }
    } catch {
      alert("Terjadi kesalahan jaringan");
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="ADMIN" userName="Administrator" />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Tarif SPP"
          subtitle="Pengaturan nominal tarif SPP bulanan berdasarkan tahun ajaran"
          userName="Administrator"
          role="ADMIN"
        />

        <div className="w-full max-w-7xl mx-auto px-6 py-6 space-y-6">
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Master Tarif SPP</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar standar biaya SPP bulanan sekolah
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tarif SPP</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Tahun Angkatan</th>
                    <th className="py-3.5 px-6">Tarif SPP Bulanan</th>
                    <th className="py-3.5 px-6">Siswa Terhubung</th>
                    <th className="py-3.5 px-6">Total Transaksi</th>
                    <th className="py-3.5 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Memuat data tarif SPP...
                      </td>
                    </tr>
                  ) : sppList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Belum ada tarif SPP tersimpan
                      </td>
                    </tr>
                  ) : (
                    sppList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            Tahun {s.tahun}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-emerald-600 text-base">
                            {formatRupiah(s.nominal)}
                          </span>
                          <span className="text-xs text-slate-400 block">per bulan</span>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-700">
                          {s._count.siswa} Siswa
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-500">
                          {s._count.pembayaran} Pembayaran tercatat
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(s)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Tarif"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.tahun)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Tarif"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Form SPP */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingSpp ? "Edit Tarif SPP" : "Tambah Tarif SPP Baru"}
        >
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Tahun Angkatan / Ajaran *
              </label>
              <input
                type="number"
                required
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                placeholder="2024"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Nominal Bulanan (Rp) *
              </label>
              <input
                type="number"
                required
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                placeholder="250000"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-500/20"
              >
                {submitting ? "Menyimpan..." : "Simpan Tarif"}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
