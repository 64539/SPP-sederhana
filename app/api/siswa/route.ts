import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import {
  createSiswaSchema,
  updateSiswaSchema,
  formatZodErrors,
} from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const kelasId = searchParams.get("kelasId");

    const whereClause: Record<string, unknown> = {};

    if (search) {
      whereClause.OR = [
        { nama: { contains: search } },
        { nisn: { contains: search } },
        { nis: { contains: search } },
      ];
    }

    if (kelasId) {
      whereClause.kelasId = Number(kelasId);
    }

    const siswaList = await prisma.siswa.findMany({
      where: whereClause,
      include: {
        kelas: true,
        jurusan: true,
        spp: true,
        akun: {
          select: { id: true, username: true },
        },
        _count: {
          select: { pembayaran: true },
        },
      },
      orderBy: { nama: "asc" },
    });

    return NextResponse.json(siswaList);
  } catch (error) {
    console.error("GET siswa error:", error);
    return NextResponse.json({ error: "Gagal mengambil data siswa" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();

    // 1. Validasi Zod
    const validation = createSiswaSchema.safeParse(body);
    if (!validation.success) {
      const { error, fieldErrors } = formatZodErrors(validation.error);
      return NextResponse.json({ error, fieldErrors }, { status: 400 });
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

    // 2. Cek keunikan NISN & NIS
    const existingNisn = await prisma.siswa.findUnique({ where: { nisn } });
    if (existingNisn) {
      return NextResponse.json(
        {
          error: `NISN '${nisn}' sudah terdaftar`,
          fieldErrors: { nisn: `NISN '${nisn}' sudah terdaftar` },
        },
        { status: 400 }
      );
    }

    const existingNis = await prisma.siswa.findUnique({ where: { nis } });
    if (existingNis) {
      return NextResponse.json(
        {
          error: `NIS '${nis}' sudah terdaftar`,
          fieldErrors: { nis: `NIS '${nis}' sudah terdaftar` },
        },
        { status: 400 }
      );
    }

    const accountUsername = username?.trim() || nisn;
    const accountPassword = password?.trim() || "siswa123";

    const existingUser = await prisma.akun.findUnique({
      where: { username: accountUsername },
    });
    if (existingUser) {
      return NextResponse.json(
        {
          error: `Username akun '${accountUsername}' sudah digunakan`,
          fieldErrors: { username: `Username '${accountUsername}' sudah digunakan` },
        },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(accountPassword);

    // Create akun + siswa in transaction
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

    return NextResponse.json(newSiswa, { status: 201 });
  } catch (error) {
    console.error("POST siswa error:", error);
    return NextResponse.json({ error: "Gagal menambahkan data siswa" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();

    // 1. Validasi Zod
    const validation = updateSiswaSchema.safeParse(body);
    if (!validation.success) {
      const { error, fieldErrors } = formatZodErrors(validation.error);
      return NextResponse.json({ error, fieldErrors }, { status: 400 });
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

    const siswa = await prisma.siswa.findUnique({
      where: { id },
      include: { akun: true },
    });

    if (!siswa) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    // Cek unik NISN jika berubah
    if (nisn !== siswa.nisn) {
      const existingNisn = await prisma.siswa.findUnique({ where: { nisn } });
      if (existingNisn) {
        return NextResponse.json(
          {
            error: `NISN '${nisn}' sudah terdaftar`,
            fieldErrors: { nisn: `NISN '${nisn}' sudah terdaftar` },
          },
          { status: 400 }
        );
      }
    }

    // Cek unik NIS jika berubah
    if (nis !== siswa.nis) {
      const existingNis = await prisma.siswa.findUnique({ where: { nis } });
      if (existingNis) {
        return NextResponse.json(
          {
            error: `NIS '${nis}' sudah terdaftar`,
            fieldErrors: { nis: `NIS '${nis}' sudah terdaftar` },
          },
          { status: 400 }
        );
      }
    }

    // Update siswa & optionally password akun
    const updatedSiswa = await prisma.$transaction(async (tx) => {
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

    return NextResponse.json(updatedSiswa);
  } catch (error) {
    console.error("PUT siswa error:", error);
    return NextResponse.json({ error: "Gagal memperbarui data siswa" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID siswa wajib disertakan" }, { status: 400 });
    }

    const siswa = await prisma.siswa.findUnique({
      where: { id: Number(id) },
    });

    if (!siswa) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    await prisma.akun.delete({
      where: { id: siswa.akunId },
    });

    return NextResponse.json({ success: true, message: "Siswa berhasil dihapus" });
  } catch (error) {
    console.error("DELETE siswa error:", error);
    return NextResponse.json({ error: "Gagal menghapus siswa" }, { status: 500 });
  }
}
