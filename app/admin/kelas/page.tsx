"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Modal from "@/components/Modal";
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Users,
} from "lucide-react";

interface Kelas {
  id: number;
  namaKelas: string;
  _count: { siswa: number };
}

export default function KelasPage() {
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [namaKelas, setNamaKelas] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadKelas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/kelas");
      const data = await res.json();
      if (Array.isArray(data)) {
        setKelasList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKelas();
  }, []);

  const openAddModal = () => {
    setEditingKelas(null);
    setNamaKelas("");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (k: Kelas) => {
    setEditingKelas(k);
    setNamaKelas(k.namaKelas);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        id: editingKelas?.id,
        namaKelas,
      };

      const res = await fetch("/api/kelas", {
        method: editingKelas ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan data kelas");
      }

      setSuccessMsg(
        editingKelas ? "Kelas berhasil diperbarui" : "Kelas baru berhasil ditambahkan"
      );
      setModalOpen(false);
      loadKelas();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Hapus kelas "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/kelas?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Kelas berhasil dihapus");
        loadKelas();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert(data.error || "Gagal menghapus kelas");
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
          title="Data Kelas"
          subtitle="Manajemen rombongan belajar dan kelas siswa"
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
              <h3 className="font-bold text-slate-900 text-base">Rombongan Belajar (Kelas)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {kelasList.length} kelas terdaftar di sistem
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kelas</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">No</th>
                    <th className="py-3.5 px-6">Nama Kelas</th>
                    <th className="py-3.5 px-6">Jumlah Siswa</th>
                    <th className="py-3.5 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Memuat data kelas...
                      </td>
                    </tr>
                  ) : kelasList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        Belum ada kelas terdaftar
                      </td>
                    </tr>
                  ) : (
                    kelasList.map((k, idx) => (
                      <tr key={k.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6 text-xs text-slate-400">{idx + 1}</td>
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-bold text-sm">
                            {k.namaKelas}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            {k._count.siswa} Siswa
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(k)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Kelas"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(k.id, k.namaKelas)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Kelas"
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

        {/* Modal Form Kelas */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingKelas ? "Edit Kelas" : "Tambah Kelas Baru"}
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
                Nama Kelas *
              </label>
              <input
                type="text"
                required
                value={namaKelas}
                onChange={(e) => setNamaKelas(e.target.value)}
                placeholder="Contoh: XII RPL 1, XI TKJ 2"
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
                {submitting ? "Menyimpan..." : "Simpan Kelas"}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
