import { z } from "zod";

/**
 * Sanitasi string sederhana untuk mencegah XSS dasar
 */
export function sanitizeString(val: string): string {
  return val
    .trim()
    .replace(/[<>]/g, "") // Hapus karakter kurung sudut
    .replace(/\s+/g, " "); // Rapikan multiple spaces
}

/**
 * Schema Validasi Siswa (Tambah Data)
 */
export const createSiswaSchema = z.object({
  nisn: z
    .string({ message: "NISN wajib diisi" })
    .trim()
    .regex(/^\d+$/, { message: "NISN wajib hanya berisi angka" })
    .length(10, { message: "NISN harus tepat 10 digit angka" }),
  nis: z
    .string({ message: "NIS wajib diisi" })
    .trim()
    .regex(/^\d+$/, { message: "NIS wajib hanya berisi angka" })
    .min(4, { message: "NIS minimal 4 digit angka" })
    .max(20, { message: "NIS maksimal 20 digit angka" }),
  nama: z
    .string({ message: "Nama siswa wajib diisi" })
    .trim()
    .min(2, { message: "Nama siswa minimal 2 karakter" })
    .max(100, { message: "Nama siswa maksimal 100 karakter" })
    .refine((val) => !/[<>]/.test(val), {
      message: "Nama tidak boleh mengandung karakter HTML (< atau >)",
    })
    .transform(sanitizeString),
  noTelp: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val || val === "") return true;
        return /^\d{10,15}$/.test(val);
      },
      {
        message: "No. Telepon harus berupa angka antara 10 sampai 15 digit",
      }
    ),
  alamat: z
    .string()
    .trim()
    .max(255, { message: "Alamat maksimal 255 karakter" })
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeString(val) : null)),
  kelasId: z.coerce
    .number({ message: "Kelas wajib dipilih" })
    .int()
    .positive({ message: "Pilih kelas yang valid" }),
  jurusanId: z.coerce
    .number({ message: "Jurusan wajib dipilih" })
    .int()
    .positive({ message: "Pilih jurusan yang valid" }),
  sppId: z.coerce
    .number()
    .int()
    .positive({ message: "Pilih tarif SPP yang valid" })
    .optional()
    .nullable(),
  username: z
    .string()
    .trim()
    .optional()
    .nullable(),
  password: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length >= 6, {
      message: "Password minimal 6 karakter",
    }),
});

/**
 * Schema Validasi Siswa (Update Data)
 */
export const updateSiswaSchema = createSiswaSchema.extend({
  id: z.coerce.number().int().positive({ message: "ID siswa tidak valid" }),
});

/**
 * Schema Validasi Petugas
 */
export const createPetugasSchema = z.object({
  username: z
    .string({ message: "Username wajib diisi" })
    .trim()
    .min(3, { message: "Username minimal 3 karakter" })
    .max(50, { message: "Username maksimal 50 karakter" })
    .regex(/^[a-zA-Z0-9_.-]+$/, {
      message: "Username hanya boleh huruf, angka, underscore, titik, atau strip",
    }),
  password: z
    .string({ message: "Password wajib diisi" })
    .min(6, { message: "Password minimal 6 karakter" }),
  namaLengkap: z
    .string({ message: "Nama lengkap petugas wajib diisi" })
    .trim()
    .min(2, { message: "Nama lengkap minimal 2 karakter" })
    .max(100, { message: "Nama lengkap maksimal 100 karakter" })
    .refine((val) => !/[<>]/.test(val), {
      message: "Nama tidak boleh mengandung karakter HTML",
    })
    .transform(sanitizeString),
  role: z.enum(["ADMIN", "PETUGAS"], {
    message: "Role harus ADMIN atau PETUGAS",
  }),
});

export const updatePetugasSchema = z.object({
  id: z.coerce.number().int().positive({ message: "ID petugas tidak valid" }),
  username: z
    .string({ message: "Username wajib diisi" })
    .trim()
    .min(3, { message: "Username minimal 3 karakter" })
    .max(50, { message: "Username maksimal 50 karakter" }),
  password: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.length >= 6, {
      message: "Password minimal 6 karakter jika ingin diubah",
    }),
  namaLengkap: z
    .string({ message: "Nama lengkap petugas wajib diisi" })
    .trim()
    .min(2, { message: "Nama lengkap minimal 2 karakter" })
    .max(100, { message: "Nama lengkap maksimal 100 karakter" })
    .refine((val) => !/[<>]/.test(val), {
      message: "Nama tidak boleh mengandung karakter HTML",
    })
    .transform(sanitizeString),
  role: z.enum(["ADMIN", "PETUGAS"], {
    message: "Role harus ADMIN atau PETUGAS",
  }),
});

/**
 * Schema Validasi Kelas
 */
export const kelasSchema = z.object({
  namaKelas: z
    .string({ message: "Nama kelas wajib diisi" })
    .trim()
    .min(2, { message: "Nama kelas minimal 2 karakter" })
    .max(50, { message: "Nama kelas maksimal 50 karakter" })
    .refine((val) => !/[<>]/.test(val), {
      message: "Nama kelas tidak boleh mengandung karakter berbahaya",
    })
    .transform(sanitizeString),
});

export const updateKelasSchema = kelasSchema.extend({
  id: z.coerce.number().int().positive({ message: "ID kelas tidak valid" }),
});

/**
 * Schema Validasi SPP
 */
export const sppSchema = z.object({
  tahun: z.coerce
    .number({ message: "Tahun SPP wajib diisi" })
    .int()
    .min(2000, { message: "Tahun minimal 2000" })
    .max(2100, { message: "Tahun maksimal 2100" }),
  nominal: z.coerce
    .number({ message: "Nominal tarif SPP wajib diisi" })
    .positive({ message: "Nominal SPP harus lebih dari 0" })
    .max(100000000, { message: "Nominal SPP melebihi batas wajar" }),
});

export const updateSppSchema = sppSchema.extend({
  id: z.coerce.number().int().positive({ message: "ID SPP tidak valid" }),
});

/**
 * Schema Validasi Pembayaran SPP
 */
export const createPembayaranSchema = z.object({
  siswaId: z.coerce.number().int().positive({ message: "Siswa wajib dipilih" }),
  bulanDibayar: z
    .string({ message: "Bulan dibayar wajib dipilih" })
    .trim()
    .min(1, { message: "Bulan dibayar tidak boleh kosong" }),
  tahunDibayar: z.coerce
    .string({ message: "Tahun dibayar wajib diisi" })
    .trim()
    .min(4, { message: "Tahun dibayar tidak valid" }),
  sppId: z.coerce.number().int().positive({ message: "Tarif SPP tidak valid" }).optional().nullable(),
  nominal: z.coerce
    .number({ message: "Nominal pembayaran wajib diisi" })
    .positive({ message: "Nominal pembayaran harus berupa angka positif" })
    .max(100000000, { message: "Nominal pembayaran melebihi batas wajar" }),
  keterangan: z
    .string()
    .trim()
    .max(100, { message: "Keterangan maksimal 100 karakter" })
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeString(val) : "Lunas")),
});

/**
 * Format error dari Zod menjadi pesan umum dan error per field
 */
export function formatZodErrors(error: z.ZodError): {
  error: string;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path[0]?.toString();
    if (field && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }

  const firstErrorMessage =
    error.issues[0]?.message || "Validasi data gagal";

  return {
    error: firstErrorMessage,
    fieldErrors,
  };
}
