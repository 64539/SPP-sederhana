"use server";

import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import {
  createSiswaSchema,
  updateSiswaSchema,
  formatZodErrors,
} from "@/lib/validations";
import { revalidatePath } from "next/cache";

export type ActionResponse<T = unknown> = {
  success: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  data?: T;
};

/**
 * Server Action: Tambah Siswa Baru
 */
export async function createSiswaAction(
  rawInput: unknown
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return {
        success: false,
        error: "Akses ditolak. Hanya Administrator yang dapat menambah siswa.",
      };
    }

    // 1. Validasi Zod
    const validation = createSiswaSchema.safeParse(rawInput);
    if (!validation.success) {
      const { error, fieldErrors } = formatZodErrors(validation.error);
      return {
        success: false,
        error,
        fieldErrors,
      };
    }

    const {
      nisn,
      nis,
      nama,
      alamat,
      noTelp,
      kelasId,
      jurusanId,
      sppId,
      username,
      password,
    } = validation.data;

    // 2. Cek keunikan NISN
    const existingNisn = await prisma.siswa.findUnique({ where: { nisn } });
    if (existingNisn) {
      return {
        success: false,
        error: `NISN '${nisn}' sudah terdaftar pada sistem`,
        fieldErrors: { nisn: `NISN '${nisn}' sudah terdaftar pada sistem` },
      };
    }

    // 3. Cek keunikan NIS
    const existingNis = await prisma.siswa.findUnique({ where: { nis } });
    if (existingNis) {
      return {
        success: false,
        error: `NIS '${nisn}' sudah terdaftar pada sistem`,
        fieldErrors: { nis: `NIS '${nis}' sudah terdaftar pada sistem` },
      };
    }

    // 4. Setup akun login siswa
    const accountUsername = username?.trim() || nisn;
    const accountPassword = password?.trim() || "siswa123";

    const existingUser = await prisma.akun.findUnique({
      where: { username: accountUsername },
    });
    if (existingUser) {
      return {
        success: false,
        error: `Username akun '${accountUsername}' sudah digunakan`,
        fieldErrors: { username: `Username '${accountUsername}' sudah digunakan` },
      };
    }

    const hashedPassword = await hashPassword(accountPassword);

    // 5. Eksekusi database transaksi
    const newSiswa = await prisma.$transaction(async (tx) => {
      const akun = await tx.akun.create({
        data: {
          username: accountUsername,
          password: hashedPassword,
          namaLengkap: nama,
          role: "SISWA",
        },
      });

      return tx.siswa.create({
        data: {
          nisn,
          nis,
          nama,
          alamat: alamat || null,
          noTelp: noTelp || null,
          akunId: akun.id,
          kelasId,
          jurusanId,
          sppId: sppId || null,
        },
        include: {
          kelas: true,
          jurusan: true,
          spp: true,
          akun: {
            select: { id: true, username: true },
          },
        },
      });
    });

    revalidatePath("/admin/siswa");
    return {
      success: true,
      message: "Data siswa baru berhasil ditambahkan beserta akun login",
      data: newSiswa,
    };
  } catch (error) {
    console.error("createSiswaAction error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan internal saat menyimpan data siswa",
    };
  }
}

/**
 * Server Action: Perbarui Data Siswa
 */
export async function updateSiswaAction(
  rawInput: unknown
): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return {
        success: false,
        error: "Akses ditolak. Hanya Administrator yang dapat memperbarui siswa.",
      };
    }

    // 1. Validasi Zod
    const validation = updateSiswaSchema.safeParse(rawInput);
    if (!validation.success) {
      const { error, fieldErrors } = formatZodErrors(validation.error);
      return {
        success: false,
        error,
        fieldErrors,
      };
    }

    const {
      id,
      nisn,
      nis,
      nama,
      alamat,
      noTelp,
      kelasId,
      jurusanId,
      sppId,
      password,
    } = validation.data;

    // 2. Cek eksistensi siswa
    const siswa = await prisma.siswa.findUnique({
      where: { id },
      include: { akun: true },
    });
    if (!siswa) {
      return { success: false, error: "Data siswa tidak ditemukan" };
    }

    // 3. Cek keunikan NISN jika diubah
    if (nisn !== siswa.nisn) {
      const existingNisn = await prisma.siswa.findUnique({ where: { nisn } });
      if (existingNisn) {
        return {
          success: false,
          error: `NISN '${nisn}' sudah terdaftar pada siswa lain`,
          fieldErrors: { nisn: `NISN '${nisn}' sudah terdaftar` },
        };
      }
    }

    // 4. Cek keunikan NIS jika diubah
    if (nis !== siswa.nis) {
      const existingNis = await prisma.siswa.findUnique({ where: { nis } });
      if (existingNis) {
        return {
          success: false,
          error: `NIS '${nis}' sudah terdaftar pada siswa lain`,
          fieldErrors: { nis: `NIS '${nis}' sudah terdaftar` },
        };
      }
    }

    // 5. Eksekusi update database
    const updated = await prisma.$transaction(async (tx) => {
      if (password && password.trim() !== "") {
        const hashedPassword = await hashPassword(password);
        await tx.akun.update({
          where: { id: siswa.akunId },
          data: {
            namaLengkap: nama,
            password: hashedPassword,
          },
        });
      } else {
        await tx.akun.update({
          where: { id: siswa.akunId },
          data: { namaLengkap: nama },
        });
      }

      return tx.siswa.update({
        where: { id },
        data: {
          nisn,
          nis,
          nama,
          alamat: alamat || null,
          noTelp: noTelp || null,
          kelasId,
          jurusanId,
          sppId: sppId || null,
        },
        include: {
          kelas: true,
          jurusan: true,
          spp: true,
        },
      });
    });

    revalidatePath("/admin/siswa");
    return {
      success: true,
      message: "Data siswa berhasil diperbarui",
      data: updated,
    };
  } catch (error) {
    console.error("updateSiswaAction error:", error);
    return {
      success: false,
      error: "Terjadi kesalahan internal saat memperbarui data siswa",
    };
  }
}

/**
 * Server Action: Hapus Siswa
 */
export async function deleteSiswaAction(id: number): Promise<ActionResponse> {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return {
        success: false,
        error: "Akses ditolak. Hanya Administrator yang dapat menghapus siswa.",
      };
    }

    const siswa = await prisma.siswa.findUnique({
      where: { id: Number(id) },
    });
    if (!siswa) {
      return { success: false, error: "Data siswa tidak ditemukan" };
    }

    // Menghapus akun akan cascade delete data siswa
    await prisma.akun.delete({
      where: { id: siswa.akunId },
    });

    revalidatePath("/admin/siswa");
    return {
      success: true,
      message: "Siswa berhasil dihapus dari sistem",
    };
  } catch (error) {
    console.error("deleteSiswaAction error:", error);
    return {
      success: false,
      error: "Gagal menghapus siswa dari database",
    };
  }
}
