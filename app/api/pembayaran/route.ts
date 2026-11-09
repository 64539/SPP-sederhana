import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createPembayaranSchema, formatZodErrors } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siswaIdParam = searchParams.get("siswaId");
    const tahunParam = searchParams.get("tahun");
    const bulanParam = searchParams.get("bulan");

    const whereClause: Record<string, unknown> = {};

    // Jika SISWA, paksa hanya bisa melihat data miliknya sendiri
    if (session.role === "SISWA") {
      if (!session.siswaId) {
        return NextResponse.json({ error: "Profil siswa tidak ditemukan" }, { status: 404 });
      }
      whereClause.siswaId = session.siswaId;
    } else {
      // Petugas atau Admin bisa filter siswa spesifik
      if (siswaIdParam) {
        whereClause.siswaId = Number(siswaIdParam);
      }
    }

    if (tahunParam) {
      whereClause.tahunDibayar = tahunParam;
    }

    if (bulanParam) {
      whereClause.bulanDibayar = bulanParam;
    }

    const list = await prisma.pembayaran.findMany({
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
            role: true,
          },
        },
      },
      orderBy: {
        tanggalBayar: "desc",
      },
    });

    return NextResponse.json(list);
  } catch (error) {
    console.error("GET pembayaran error:", error);
    return NextResponse.json({ error: "Gagal mengambil riwayat pembayaran" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "ADMIN" && session.role !== "PETUGAS")) {
      return NextResponse.json({ error: "Akses ditolak: hanya Admin & Petugas yang dapat mengentri pembayaran" }, { status: 403 });
    }

    const body = await req.json();
    const validation = createPembayaranSchema.safeParse(body);
    if (!validation.success) {
      const { error, fieldErrors } = formatZodErrors(validation.error);
      return NextResponse.json({ error, fieldErrors }, { status: 400 });
    }

    const { siswaId, bulanDibayar, tahunDibayar, sppId, nominal, keterangan } = validation.data;

    // 1. Validasi keberadaan siswa
    const siswa = await prisma.siswa.findUnique({
      where: { id: Number(siswaId) },
      include: { spp: true },
    });

    if (!siswa) {
      return NextResponse.json({ error: "Data siswa tidak ditemukan" }, { status: 404 });
    }

    const resolvedSppId = sppId ? Number(sppId) : siswa.sppId;
    if (!resolvedSppId) {
      return NextResponse.json({ error: "Tarif SPP siswa belum ditentukan" }, { status: 400 });
    }

    // 2. Cegah pembayaran ganda untuk bulan dan tahun yang sama
    const existing = await prisma.pembayaran.findFirst({
      where: {
        siswaId: Number(siswaId),
        bulanDibayar,
        tahunDibayar: String(tahunDibayar),
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Siswa ini sudah melunasi SPP bulan ${bulanDibayar} ${tahunDibayar}` },
        { status: 400 }
      );
    }

    // 3. Simpan transaksi pembayaran
    const pembayaran = await prisma.pembayaran.create({
      data: {
        siswaId: Number(siswaId),
        bulanDibayar,
        tahunDibayar: String(tahunDibayar),
        sppId: resolvedSppId,
        nominal: Number(nominal),
        petugasId: session.id, // Log petugas yang memproses
        keterangan: keterangan || "Lunas",
      },
      include: {
        siswa: {
          include: {
            kelas: true,
            jurusan: true,
          },
        },
        petugas: {
          select: {
            id: true,
            namaLengkap: true,
            username: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(pembayaran, { status: 201 });
  } catch (error) {
    console.error("POST pembayaran error:", error);
    return NextResponse.json({ error: "Gagal menyimpan transaksi pembayaran" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Hanya Admin yang dapat membatalkan transaksi" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID transaksi wajib disertakan" }, { status: 400 });
    }

    await prisma.pembayaran.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ success: true, message: "Transaksi berhasil dibatalkan" });
  } catch (error) {
    console.error("DELETE pembayaran error:", error);
    return NextResponse.json({ error: "Gagal membatalkan transaksi" }, { status: 500 });
  }
}
