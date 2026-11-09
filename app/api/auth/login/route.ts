import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, setSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    const akun = await prisma.akun.findUnique({
      where: { username },
      include: {
        siswa: true,
      },
    });

    if (!akun) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, akun.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Username atau password salah" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: akun.id,
      username: akun.username,
      namaLengkap: akun.namaLengkap,
      role: akun.role,
      siswaId: akun.siswa?.id || null,
      nisn: akun.siswa?.nisn || null,
    };

    await setSession(sessionUser);

    let redirectUrl = "/admin/dashboard";
    if (akun.role === "PETUGAS") {
      redirectUrl = "/petugas/dashboard";
    } else if (akun.role === "SISWA") {
      redirectUrl = "/siswa/dashboard";
    }

    return NextResponse.json({
      success: true,
      user: sessionUser,
      redirectUrl,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500 }
    );
  }
}
