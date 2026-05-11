import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const files = await prisma.files.findMany({
    where: { user_id: session.userId },
    orderBy: { uploaded_at: "desc" },
    select: {
      id: true,
      filename: true,
      content_type: true,
      size: true,
      uploaded_at: true,
      expires_at: true,
      download_count: true,
      max_downloads: true,
      password_hash: true,
      folder_id: true,
      email_sender: true,
      email_recipient: true,
    },
  }) as unknown as Array<{
    size: string | number;
    expires_at: Date | null;
    download_count: number;
    max_downloads: number | null;
    password_hash: string | null;
    is_expired?: boolean;
    is_download_limit_reached?: boolean;
    has_password?: boolean;
  }>;

  const now = new Date();
  for (const file of files) {
    file.is_expired = file.expires_at ? file.expires_at < now : false;
    file.is_download_limit_reached = file.max_downloads ? file.download_count >= file.max_downloads : false;
    file.has_password = !!file.password_hash;
    file.size = Number(file.size);
  }

  return Response.json({ files, isAdmin: session.isAdmin });
}
