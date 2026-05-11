import prisma from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const user = await prisma.users.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      isAdmin: true,
    }
  });
  if (!user) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await createSession(user.id, user.email, user.isAdmin);
  return Response.json({ success: true });
}
