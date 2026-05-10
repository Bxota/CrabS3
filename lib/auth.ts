import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: number, email: string) {
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  const session = await prisma.session.create({
    data: { userId, expiresAt, email },
  });

  const cookieStore = await cookies();
  cookieStore.set("session", session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return session;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } });
    cookieStore.delete("session");
  }
}
