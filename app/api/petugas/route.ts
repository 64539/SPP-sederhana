import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";
import { createPetugasSchema, updatePetugasSchema, formatZodErrors } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const petugasList = await prisma.akun.findMany({
      where: {
        role: { in: ["ADMIN", "PETUGAS"] },
      },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        createdAt: true,
        _count: {
          select: { pembayaranProcessed: true },
        },
      },
      orderBy: { id: "asc" },
    });

    return NextResponse.json(petugasList);
  } catch (error) {
    console.error("GET petugas error:", error);
    return NextResponse.json({ error: "Gagal mengambil data petugas" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const validation = createPetugasSchema.safeParse(body);
    if (!validation.success) {
      const { error, fieldErrors } = formatZodErrors(validation.error);
      return NextResponse.json({ error, fieldErrors }, { status: 400 });
    }

    const { username, password, namaLengkap, role } = validation.data;

    const existing = await prisma.akun.findUnique({
      where: { username },
    });
    if (existing) {
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 400 });
    }

    const hashedPassword = await hashPassword(password);
    const newPetugas = await prisma.akun.create({
      data: {
        username,
        password: hashedPassword,
        namaLengkap,
        role,
      },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newPetugas, { status: 201 });
  } catch (error) {
    console.error("POST petugas error:", error);
    return NextResponse.json({ error: "Gagal menambahkan akun petugas" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const validation = updatePetugasSchema.safeParse(body);
    if (!validation.success) {
      const { error, fieldErrors } = formatZodErrors(validation.error);
      return NextResponse.json({ error, fieldErrors }, { status: 400 });
    }

    const { id, namaLengkap, role, password } = validation.data;

    const updateData: { namaLengkap: string; role: "ADMIN" | "PETUGAS"; password?: string } = {
      namaLengkap,
      role,
    };

    if (password && password.trim() !== "") {
      updateData.password = await hashPassword(password);
    }

    const updated = await prisma.akun.update({
      where: { id: Number(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT petugas error:", error);
    return NextResponse.json({ error: "Gagal memperbarui akun petugas" }, { status: 500 });
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
      return NextResponse.json({ error: "ID petugas wajib disertakan" }, { status: 400 });
    }

    if (Number(id) === session.id) {
      return NextResponse.json({ error: "Tidak dapat menghapus akun Anda sendiri" }, { status: 400 });
    }

    await prisma.akun.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: "Akun berhasil dihapus" });
  } catch (error) {
    console.error("DELETE petugas error:", error);
    return NextResponse.json({ error: "Gagal menghapus akun" }, { status: 500 });
  }
}
