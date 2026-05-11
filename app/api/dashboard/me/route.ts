import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, password } = await request.json();

  if (typeof name !== "string" || name.trim() === "") {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const user = await prisma.users.findUnique({
    where: { id: session.userId },
    select: { name: true },
  });
  if (!user) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  let newPasswordHash: string | null = null;
  if (password) {
    if (typeof password !== "string" || password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    newPasswordHash = await bcrypt.hash(password, 12);
  }

  const updatedUser = await prisma.users.update({
    where: { id: session.userId },
    select: { name: true },
    data: {
      name: name.trim(),
      ...(newPasswordHash && {
        passwordHash: newPasswordHash
      }),
    },
  });

  return Response.json({ user: { name: updatedUser.name } });

}
