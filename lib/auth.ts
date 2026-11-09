import crypto from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const COOKIE_NAME = "spp_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "spp-secret-key-ukk-rpl-2026-super-secure";

export interface SessionUser {
  id: number;
  username: string;
  namaLengkap: string;
  role: "ADMIN" | "PETUGAS" | "SISWA";
  siswaId?: number | null;
  nisn?: string | null;
}

// Sign session payload with HMAC SHA-256
export function createSessionToken(user: SessionUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
}

// Verify and decode session token
export function verifySessionToken(token: string): SessionUser | null {
  try {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payload)
      .digest("base64url");

    if (signature !== expectedSignature) {
      return null;
    }

    const jsonStr = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(jsonStr) as SessionUser;
  } catch {
    return null;
  }
}

// Set session cookie (Server Actions / Route Handlers)
export async function setSession(user: SessionUser) {
  const token = createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Get session from cookie
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Clear session cookie
export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Password helpers
export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, 10);
}

export async function comparePassword(plainText: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plainText, hashed);
}
