import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sppSchema, updateSppSchema, formatZodErrors } from "@/lib/validations";

export async function GET() {
  try {
    const sppList = await prisma.spp.findMany({
      include: {
        _count: {
          select: { siswa: true, pembayaran: true },
        },
      },
      orderBy: { tahun: "desc" },
    });
    return NextResponse.json(sppList);
  } catch (error) {
    console.error("GET spp error:", error);
    return NextResponse.json({ error: "Gagal mengambil data SPP" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const validation = sppSchema.safeParse(body);
    if (!validation.success) {
      const { error, fieldErrors } = formatZodErrors(validation.error);
      return NextResponse.json({ error, fieldErrors }, { status: 400 });
    }

    const { tahun, nominal } = validation.data;

    const newSpp = await prisma.spp.create({
      data: {
        tahun,
        nominal,
      },
    });

    return NextResponse.json(newSpp, { status: 201 });
  } catch (error) {
    console.error("POST spp error:", error);
    return NextResponse.json({ error: "Gagal menambahkan tarif SPP" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const validation = updateSppSchema.safeParse(body);
    if (!validation.success) {
      const { error, fieldErrors } = formatZodErrors(validation.error);
      return NextResponse.json({ error, fieldErrors }, { status: 400 });
    }

    const { id, tahun, nominal } = validation.data;

    const updated = await prisma.spp.update({
      where: { id },
      data: {
        tahun,
        nominal,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT spp error:", error);
    return NextResponse.json({ error: "Gagal memperbarui tarif SPP" }, { status: 500 });
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
      return NextResponse.json({ error: "ID SPP wajib disertakan" }, { status: 400 });
    }

    const countPembayaran = await prisma.pembayaran.count({
      where: { sppId: Number(id) },
    });
    if (countPembayaran > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus: terdapat ${countPembayaran} riwayat pembayaran terhubung` },
        { status: 400 }
      );
    }

    await prisma.spp.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: "Tarif SPP berhasil dihapus" });
  } catch (error) {
    console.error("DELETE spp error:", error);
    return NextResponse.json({ error: "Gagal menghapus tarif SPP" }, { status: 500 });
  }
}
