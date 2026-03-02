import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

export async function verifyLogin(
  username: string,
  password: string
): Promise<boolean> {
  if (username !== ADMIN_USER) return false;

  // Si no hay hash configurado, comparar directo (solo para setup inicial)
  if (!ADMIN_PASSWORD_HASH) {
    return password === (process.env.ADMIN_PASSWORD || "admin123");
  }

  return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
}

export function generateToken(): string {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return false;
    return verifyToken(token);
  } catch {
    return false;
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}
