"use client";

import { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Modal from "@/components/Modal";
import { formatRupiah } from "@/lib/utils";
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  KeyRound,
} from "lucide-react";
import {
  createSiswaAction,
  updateSiswaAction,
  deleteSiswaAction,
} from "@/actions/siswa";
import {
  createSiswaSchema,
  updateSiswaSchema,
  formatZodErrors,
} from "@/lib/validations";

interface Siswa {
  id: number;
  nisn: string;
  nis: string;
  nama: string;
  alamat: string | null;
  noTelp: string | null;
  kelasId: number;
  jurusanId: number;
  sppId: number | null;
  kelas: { id: number; namaKelas: string };
  jurusan: { id: number; namaJurusan: string };
  spp: { id: number; tahun: number; nominal: number } | null;
  akun: { id: number; username: string };
}

interface Kelas {
  id: number;
  namaKelas: string;
}

interface Jurusan {
  id: number;
  namaJurusan: string;
}

interface Spp {
  id: number;
  tahun: number;
  nominal: number;
}

export default function SiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [sppList, setSppList] = useState<Spp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState<Siswa | null>(null);

  // Form states
  const [nisn, setNisn] = useState("");
  const [nis, setNis] = useState("");
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [noTelp, setNoTelp] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [jurusanId, setJurusanId] = useState("");
  const [sppId, setSppId] = useState("");
  const [password, setPassword] = useState("");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      const [siswaRes, kRes, jRes, sRes] = await Promise.all([
        fetch("/api/siswa"),
        fetch("/api/kelas"),
        fetch("/api/jurusan"),
        fetch("/api/spp"),
      ]);

      setSiswaList(await siswaRes.json());
      setKelasList(await kRes.json());
      setJurusanList(await jRes.json());
      setSppList(await sRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openAddModal = () => {
    setEditingSiswa(null);
    setNisn("");
    setNis("");
    setNama("");
    setAlamat("");
    setNoTelp("");
    setKelasId(kelasList[0]?.id.toString() || "");
    setJurusanId(jurusanList[0]?.id.toString() || "");
    setSppId(sppList[0]?.id.toString() || "");
    setPassword("siswa123");
    setErrorMsg(null);
    setFieldErrors({});
    setModalOpen(true);
  };

  const openEditModal = (s: Siswa) => {
    setEditingSiswa(s);
    setNisn(s.nisn);
    setNis(s.nis);
    setNama(s.nama);
    setAlamat(s.alamat || "");
    setNoTelp(s.noTelp || "");
    setKelasId(s.kelasId.toString());
    setJurusanId(s.jurusanId.toString());
    setSppId(s.sppId?.toString() || "");
    setPassword("");
    setErrorMsg(null);
    setFieldErrors({});
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFieldErrors({});
    setSubmitting(true);

    try {
      // 1. Sanitasi string dasar & trimming
      const payload = {
        id: editingSiswa?.id,
        nisn: nisn.trim(),
        nis: nis.trim(),
        nama: nama.trim(),
        alamat: alamat.trim() || null,
        noTelp: noTelp.trim() || null,
        kelasId: Number(kelasId),
        jurusanId: Number(jurusanId),
        sppId: sppId ? Number(sppId) : null,
        password: password ? password.trim() : undefined,
      };

      // 2. Client-side Zod validation untuk responsivitas instan
      const schema = editingSiswa ? updateSiswaSchema : createSiswaSchema;
      const clientCheck = schema.safeParse(payload);
      if (!clientCheck.success) {
        const { error, fieldErrors: errMap } = formatZodErrors(clientCheck.error);
        setFieldErrors(errMap);
        setErrorMsg(error);
        setSubmitting(false);
        return;
      }

      // 3. Eksekusi Server Action (Validasi ganda di Server Action)
      const actionRes = editingSiswa
        ? await updateSiswaAction(payload)
        : await createSiswaAction(payload);

      if (!actionRes.success) {
        if (actionRes.fieldErrors) {
          setFieldErrors(actionRes.fieldErrors);
        }
        setErrorMsg(actionRes.error || "Gagal menyimpan data siswa");
        setSubmitting(false);
        return;
      }

      setSuccessMsg(
        editingSiswa
          ? "Data siswa berhasil diperbarui"
          : "Siswa baru berhasil ditambahkan beserta akun login"
      );
      setModalOpen(false);
      loadAll();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data siswa"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, namaSiswa: string) => {
    if (!confirm(`Hapus data siswa "${namaSiswa}" beserta akun loginnya?`)) return;
    try {
      const res = await deleteSiswaAction(id);
      if (res.success) {
        setSuccessMsg(`Data siswa ${namaSiswa} berhasil dihapus`);
        loadAll();
        setTimeout(() => setSuccessMsg(null), 4000);
      } else {
        alert(res.error || "Gagal menghapus siswa");
      }
    } catch {
      alert("Terjadi kesalahan jaringan");
    }
  };

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return siswaList.filter((s) => {
      const matchesSearch =
        q === "" ||
        s.nama.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        s.nis.includes(q);
      const matchesKelas =
        filterKelas === "" || s.kelasId === Number(filterKelas);
      return matchesSearch && matchesKelas;
    });
  }, [siswaList, search, filterKelas]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="ADMIN" userName="Administrator" />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar
          title="Manajemen Data Siswa"
          subtitle="Kelola data induk siswa, NISN, kelas, jurusan, dan akun login"
          userName="Administrator"
          role="ADMIN"
        />

        <div className="w-full max-w-7xl mx-auto px-6 py-6 space-y-6">
          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-sm shadow-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Header & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 w-full md:w-auto items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan nama atau NISN..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>

              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.namaKelas}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={openAddModal}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Siswa Baru</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Daftar Siswa Terdaftar
                </h3>
                <p className="text-xs text-slate-500">
                  Total {filteredList.length} siswa ditemukan
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">Siswa</th>
                    <th className="py-3 px-4">NISN / NIS</th>
                    <th className="py-3 px-4">Kelas & Jurusan</th>
                    <th className="py-3 px-4">Tarif SPP</th>
                    <th className="py-3 px-4">Kontak / HP</th>
                    <th className="py-3 px-4">Akun Login</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Memuat data siswa...
                      </td>
                    </tr>
                  ) : filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Tidak ada data siswa ditemukan
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-semibold flex items-center justify-center text-xs">
                              {s.nama.charAt(0)}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block leading-tight">
                                {s.nama}
                              </span>
                              <span className="text-xs text-slate-400 truncate max-w-[180px] block">
                                {s.alamat || "Alamat belum diatur"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs font-semibold text-slate-900 block">
                            {s.nisn}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400 block">
                            NIS: {s.nis}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium block w-fit">
                            {s.kelas.namaKelas}
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block truncate max-w-[150px]">
                            {s.jurusan.namaJurusan}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {s.spp ? (
                            <>
                              <span className="block text-xs">
                                {formatRupiah(s.spp.nominal)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                Th. {s.spp.tahun}
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Belum diatur</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                          {s.noTelp || "-"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-md w-fit font-mono">
                            <KeyRound className="w-3 h-3 text-slate-400" />
                            <span>{s.akun.username}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openEditModal(s)}
                              title="Edit Siswa"
                              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id, s.nama)}
                              title="Hapus Siswa"
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

        {/* Modal Form Tambah / Edit Siswa */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingSiswa ? "Edit Data Siswa" : "Tambah Siswa Baru"}
          maxWidth="lg"
        >
          {errorMsg && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  NISN (10 Digit Angka) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  required
                  value={nisn}
                  onChange={(e) => {
                    setNisn(e.target.value);
                    clearFieldError("nisn");
                  }}
                  placeholder="Contoh: 0051234567"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                    fieldErrors.nisn
                      ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-200 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  } focus:outline-none transition-colors`}
                />
                {fieldErrors.nisn && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.nisn}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  NIS Lokal (Min. 4 Digit Angka) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={20}
                  required
                  value={nis}
                  onChange={(e) => {
                    setNis(e.target.value);
                    clearFieldError("nis");
                  }}
                  placeholder="Contoh: 20240101"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                    fieldErrors.nis
                      ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-200 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  } focus:outline-none transition-colors`}
                />
                {fieldErrors.nis && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.nis}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Nama Lengkap Siswa *
              </label>
              <input
                type="text"
                maxLength={100}
                required
                value={nama}
                onChange={(e) => {
                  setNama(e.target.value);
                  clearFieldError("nama");
                }}
                placeholder="Ahmad Rizky Pratama"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  fieldErrors.nama
                    ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    : "border-slate-200 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                } focus:outline-none transition-colors`}
              />
              {fieldErrors.nama && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.nama}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Kelas *
                </label>
                <select
                  required
                  value={kelasId}
                  onChange={(e) => {
                    setKelasId(e.target.value);
                    clearFieldError("kelasId");
                  }}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                    fieldErrors.kelasId
                      ? "border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-slate-200 focus:ring-1 focus:ring-blue-600"
                  } focus:outline-none bg-white transition-colors`}
                >
                  <option value="">Pilih Kelas</option>
                  {kelasList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.namaKelas}
                    </option>
                  ))}
                </select>
                {fieldErrors.kelasId && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.kelasId}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Jurusan *
                </label>
                <select
                  required
                  value={jurusanId}
                  onChange={(e) => {
                    setJurusanId(e.target.value);
                    clearFieldError("jurusanId");
                  }}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                    fieldErrors.jurusanId
                      ? "border-red-500 focus:ring-1 focus:ring-red-500"
                      : "border-slate-200 focus:ring-1 focus:ring-blue-600"
                  } focus:outline-none bg-white transition-colors`}
                >
                  <option value="">Pilih Jurusan</option>
                  {jurusanList.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.namaJurusan}
                    </option>
                  ))}
                </select>
                {fieldErrors.jurusanId && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.jurusanId}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Tarif SPP Bulanan
              </label>
              <select
                value={sppId}
                onChange={(e) => {
                  setSppId(e.target.value);
                  clearFieldError("sppId");
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              >
                <option value="">Pilih Tarif SPP</option>
                {sppList.map((s) => (
                  <option key={s.id} value={s.id}>
                    Tahun {s.tahun} - {formatRupiah(s.nominal)} / bulan
                  </option>
                ))}
              </select>
              {fieldErrors.sppId && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.sppId}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  No. Telepon / WhatsApp (10-15 Digit)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={15}
                  value={noTelp}
                  onChange={(e) => {
                    setNoTelp(e.target.value);
                    clearFieldError("noTelp");
                  }}
                  placeholder="08123456789"
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                    fieldErrors.noTelp
                      ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-200 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  } focus:outline-none transition-colors`}
                />
                {fieldErrors.noTelp && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.noTelp}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  {editingSiswa ? "Ubah Password (opsional)" : "Password Akun Siswa"}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  placeholder={editingSiswa ? "Kosongkan bila tidak diganti" : "Default: siswa123"}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                    fieldErrors.password
                      ? "border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500"
                      : "border-slate-200 focus:ring-1 focus:ring-blue-600 focus:border-blue-600"
                  } focus:outline-none transition-colors`}
                />
                {fieldErrors.password && (
                  <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Alamat Siswa
              </label>
              <textarea
                rows={2}
                maxLength={255}
                value={alamat}
                onChange={(e) => {
                  setAlamat(e.target.value);
                  clearFieldError("alamat");
                }}
                placeholder="Alamat lengkap tempat tinggal"
                className={`w-full px-3.5 py-2 text-sm rounded-lg border ${
                  fieldErrors.alamat
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-slate-200 focus:ring-1 focus:ring-blue-600"
                } focus:outline-none transition-colors`}
              />
              {fieldErrors.alamat && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.alamat}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-xs transition-colors disabled:opacity-50"
              >
                {submitting ? "Menyimpan..." : "Simpan Data"}
              </button>
            </div>
          </form>
        </Modal>
      </main>
    </div>
  );
}
