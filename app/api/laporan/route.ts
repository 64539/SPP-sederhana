import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Akses ditolak: hanya Admin yang dapat mengakses laporan" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const kelasId = searchParams.get("kelasId");
    const tahun = searchParams.get("tahun");

    const whereClause: Record<string, unknown> = {};

    if (startDate && endDate) {
      whereClause.tanggalBayar = {
        gte: new Date(startDate),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      };
    }

    if (tahun) {
      whereClause.tahunDibayar = tahun;
    }

    if (kelasId) {
      whereClause.siswa = {
        kelasId: Number(kelasId),
      };
    }

    const transaksi = await prisma.pembayaran.findMany({
      where: whereClause,
      include: {
        siswa: {
          include: {
            kelas: true,
            jurusan: true,
          },
        },
        spp: true,
        petugas: {
          select: {
            id: true,
            namaLengkap: true,
            username: true,
          },
        },
      },
      orderBy: {
        tanggalBayar: "desc",
      },
    });

    const totalNominal = transaksi.reduce((acc, curr) => acc + curr.nominal, 0);
    const totalTransaksi = transaksi.length;

    return NextResponse.json({
      transaksi,
      totalNominal,
      totalTransaksi,
    });
  } catch (error) {
    console.error("GET laporan error:", error);
    return NextResponse.json({ error: "Gagal membuat laporan" }, { status: 500 });
  }
}
