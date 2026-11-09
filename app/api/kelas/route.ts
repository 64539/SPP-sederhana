import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { kelasSchema, updateKelasSchema, formatZodErrors } from "@/lib/validations";

export async function GET() {
  try {
    const kelasList = await prisma.kelas.findMany({
      include: {
        _count: {
          select: { siswa: true },
        },
      },
      orderBy: { namaKelas: "asc" },
    });
    return NextResponse.json(kelasList);
  } catch (error) {
    console.error("GET kelas error:", error);
    return NextResponse.json({ error: "Gagal mengambil data kelas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const validation = kelasSchema.safeParse(body);
    if (!validation.success) {
      const { error, fieldErrors } = formatZodErrors(validation.error);
      return NextResponse.json({ error, fieldErrors }, { status: 400 });
    }

    const { namaKelas } = validation.data;

    const existing = await prisma.kelas.findUnique({
      where: { namaKelas },
    });
    if (existing) {
      return NextResponse.json({ error: "Nama kelas sudah terdaftar" }, { status: 400 });
    }

    const newKelas = await prisma.kelas.create({
      data: { namaKelas },
    });

    return NextResponse.json(newKelas, { status: 201 });
  } catch (error) {
    console.error("POST kelas error:", error);
    return NextResponse.json({ error: "Gagal menambahkan kelas" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateKelasSchema.safeParse(body);
    if (!validation.success) {
      const { error, fieldErrors } = formatZodErrors(validation.error);
      return NextResponse.json({ error, fieldErrors }, { status: 400 });
    }

    const { id, namaKelas } = validation.data;

    const updated = await prisma.kelas.update({
      where: { id },
      data: { namaKelas },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT kelas error:", error);
    return NextResponse.json({ error: "Gagal memperbarui kelas" }, { status: 500 });
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
      return NextResponse.json({ error: "ID kelas wajib disertakan" }, { status: 400 });
    }

    // Cek apakah masih ada siswa di kelas ini
    const countSiswa = await prisma.siswa.count({
      where: { kelasId: Number(id) },
    });
    if (countSiswa > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus: masih ada ${countSiswa} siswa di kelas ini` },
        { status: 400 }
      );
    }

    await prisma.kelas.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: "Kelas berhasil dihapus" });
  } catch (error) {
    console.error("DELETE kelas error:", error);
    return NextResponse.json({ error: "Gagal menghapus kelas" }, { status: 500 });
  }
}
