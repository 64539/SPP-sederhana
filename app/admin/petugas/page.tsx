"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Modal from "@/components/Modal";
import { formatTanggal } from "@/lib/utils";
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface Petugas {
  id: number;
  username: string;
  namaLengkap: string;
  role: "ADMIN" | "PETUGAS";
  createdAt: string;
  _count: { pembayaranProcessed: number };
}

export default function PetugasPage() {
  const [petugasList, setPetugasList] = useState<Petugas[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPetugas, setEditingPetugas] = useState<Petugas | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [role, setRole] = useState<"ADMIN" | "PETUGAS">("PETUGAS");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadPetugas = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/petugas");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPetugasList(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPetugas();
  }, []);

  const openAddModal = () => {
    setEditingPetugas(null);
    setUsername("");
    setPassword("");
    setNamaLengkap("");
    setRole("PETUGAS");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Petugas) => {
    setEditingPetugas(p);
    setUsername(p.username);
    setPassword("");
    setNamaLengkap(p.namaLengkap);
    setRole(p.role);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const payload = {
        id: editingPetugas?.id,
        username,
        password: password || undefined,
        namaLengkap,
        role,
      };

      const res = await fetch("/api/petugas", {
        method: editingPetugas ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan akun");
      }

      setSuccessMsg(
        editingPetugas
          ? "Akun petugas berhasil diperbarui"
          : "Akun petugas baru berhasil dibuat"
      );
      setModalOpen(false);
      loadPetugas();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    if (!confirm(`Hapus akun "${nama}"?`)) return;
    try {
      const res = await fetch(`/api/petugas?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg("Akun berhasil dihapus");
        loadPetugas();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert(data.error || "Gagal menghapus akun");
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
          title="Data Petugas & Admin"
          subtitle="Manajemen akun operator kasir dan administrator sistem SPP"
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
              <h3 className="font-bold text-slate-900 text-base">Daftar Operator Sistem</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {petugasList.length} akun aktif pengelola SPP
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 flex items-center gap-2 shadow-sm shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Petugas</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-6">Nama Lengkap</th>
                    <th className="py-3.5 px-6">Username</th>
                    <th className="py-3.5 px-6">Hak Akses / Role</th>
                    <th className="py-3.5 px-6">Transaksi Diproses</th>
                    <th className="py-3.5 px-6">Terdaftar Sejak</th>
                    <th className="py-3.5 px-6 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Memuat data petugas...
                      </td>
                    </tr>
                  ) : petugasList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada akun petugas
                      </td>
                    </tr>
                  ) : (
                    petugasList.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900">
                          {p.namaLengkap}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-slate-600">
                          {p.username}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              p.role === "ADMIN"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {p.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-700">
                          {p._count.pembayaranProcessed} transaksi
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400">
                          {formatTanggal(p.createdAt)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Edit Data"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.namaLengkap)}
                              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Hapus Akun"
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

        {/* Modal Form Petugas */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingPetugas ? "Edit Akun Petugas" : "Tambah Petugas / Admin"}
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
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                placeholder="Ibu Sri Wahyuni (Petugas Kasir)"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                disabled={!!editingPetugas}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username_petugas"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                {editingPetugas ? "Ubah Password (opsional)" : "Password *"}
              </label>
              <input
                type="password"
                required={!editingPetugas}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={editingPetugas ? "Kosongkan jika tidak diganti" : "••••••••"}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Hak Akses / Role *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "ADMIN" | "PETUGAS")}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                <option value="PETUGAS">Petugas (Entri Transaksi & History)</option>
                <option value="ADMIN">Administrator (Hak Penuh & Master Data)</option>
              </select>
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
                {submitting ? "Menyimpan..." : "Simpan Akun"}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
