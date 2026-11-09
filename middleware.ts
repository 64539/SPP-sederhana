import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("spp_session")?.value;

  // Function to decode basic user info from HMAC token payload (base64url)
  const getUserFromCookie = (token: string | undefined) => {
    if (!token) return null;
    try {
      const [payload] = token.split(".");
      if (!payload) return null;
      const jsonStr = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      return JSON.parse(jsonStr) as {
        id: number;
        username: string;
        namaLengkap: string;
        role: "ADMIN" | "PETUGAS" | "SISWA";
      };
    } catch {
      return null;
    }
  };

  const user = getUserFromCookie(sessionCookie);

  // If visiting / or /login
  if (pathname === "/" || pathname === "/login") {
    if (user) {
      if (user.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      } else if (user.role === "PETUGAS") {
        return NextResponse.redirect(new URL("/petugas/dashboard", request.url));
      } else if (user.role === "SISWA") {
        return NextResponse.redirect(new URL("/siswa/dashboard", request.url));
      }
    }
    if (pathname === "/") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  // Protected Admin Routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protected Petugas Routes
  if (pathname.startsWith("/petugas")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.role !== "PETUGAS" && user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protected Siswa Routes
  if (pathname.startsWith("/siswa")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (user.role !== "SISWA") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/petugas/:path*",
    "/siswa/:path*",
  ],
};
