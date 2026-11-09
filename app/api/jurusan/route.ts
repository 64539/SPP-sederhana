import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const jurusans = await prisma.jurusan.findMany({
      orderBy: { namaJurusan: "asc" },
    });
    return NextResponse.json(jurusans);
  } catch (error) {
    console.error("GET jurusan error:", error);
    return NextResponse.json({ error: "Gagal mengambil data jurusan" }, { status: 500 });
  }
}
