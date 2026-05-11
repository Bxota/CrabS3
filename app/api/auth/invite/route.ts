import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendInvitationEmail } from "@/services/mail.service";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email) {
    return Response.json({ error: "Email required" }, { status: 400 });
  }

  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "User already exists" }, { status: 409 });
  }

  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  const invitation = await prisma.invitation.upsert({
    where: { email },
    update: { token: crypto.randomUUID(), expiresAt, usedAt: null },
    create: { email, expiresAt, invitedById: session.userId },
  });

  await sendInvitationEmail(email, invitation.token);

  return Response.json({ success: true });
}
