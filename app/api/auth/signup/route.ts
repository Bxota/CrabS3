import prisma from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { token, name, password } = await request.json();

  if (!token || !name || !password) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) {
    return Response.json({ error: "Invalid invitation" }, { status: 400 });
  }
  if (invitation.usedAt) {
    return Response.json({ error: "Invitation already used" }, { status: 400 });
  }
  if (invitation.expiresAt < new Date()) {
    return Response.json({ error: "Invitation expired" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.users.create({
    data: { email: invitation.email, name, passwordHash, isAdmin: false },
  });

  await prisma.invitation.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  await createSession(user.id, invitation.email, false);

  return Response.json({ success: true });
}
