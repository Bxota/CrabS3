import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!currentUser?.isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
        files: {
          select: {
            size: true,
            expires_at: true,
            download_count: true,
            max_downloads: true,
            uploaded_at: true,
          }
        }
      },
    }) as unknown as {
      id: string;
      email: string;
      name: string;
      isAdmin: boolean;
      createdAt: Date;
      files: {
        size: number;
        expires_at: Date;
        download_count: number;
        max_downloads: number | null;
        uploaded_at: Date;
      }[]
    }[];

    const usersWithMetrics = users.map((user) => {
      const now = new Date();

      const activeFiles = user.files.filter((file) => {
        const isNotExpired = file.expires_at && new Date(file.expires_at) > now;
        const hasDownloadsAvailable =
          file.max_downloads === null || file.download_count < file.max_downloads;

        return isNotExpired && hasDownloadsAvailable;
      });

      const expiredFiles = user.files.filter((file) => {
        const isExpiredByDate = file.expires_at && new Date(file.expires_at) <= now;
        const maxDownloadsReached = file.max_downloads !== null && file.download_count >= file.max_downloads;

        return isExpiredByDate || maxDownloadsReached;
      });

      const totalSize = activeFiles.reduce((sum, file) => sum + Number(file.size), 0);
      const expiredStorageSize = expiredFiles.reduce((sum, file) => sum + Number(file.size), 0);
      const totalDownloads = user.files.reduce((sum, file) => sum + file.download_count, 0);

      const lastUploadAt = user.files.length > 0
        ? new Date(Math.max(...user.files.map(f => new Date(f.uploaded_at).getTime())))
        : null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        totalSize,
        activeFiles: activeFiles.length,
        totalFiles: user.files.length,
        totalDownloads,
        lastUploadAt,
        expiredStorageSize,
        status: "active",
      };
    });

    const pendingInvitations = await prisma.invitation.findMany({
      where: { usedAt: null },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    const pendingUsersWithMetrics = pendingInvitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      name: null,
      isAdmin: false,
      createdAt: invitation.createdAt,
      totalSize: 0,
      activeFiles: 0,
      totalFiles: 0,
      totalDownloads: 0,
      lastUploadAt: null,
      expiredStorageSize: 0,
      status: "pending",
    }));

    const allUsers = [...usersWithMetrics, ...pendingUsersWithMetrics];

    return Response.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
