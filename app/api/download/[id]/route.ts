import prisma from "@/lib/prisma";
import { HOT_BUCKET, s3Hot } from "@/services/s3.service";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import bcrypt from "bcrypt";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: fileId } = await params;
    const password = await request.json().then(data => data.password).catch(() => null);

    const metadata: { filename?: string; contentType?: string; maxDownloads?: string } = {};
    try {
      const file = await prisma.files.findUnique({
        where: { id: fileId },
        select: { password_hash: true, filename: true, size: true, max_downloads: true, download_count: true, expires_at: true },
      });
      if (file?.password_hash) {
        if (!password) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, file.password_hash);
        if (!isPasswordValid) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        metadata.filename = file.filename;
        metadata.contentType = "application/octet-stream";
      }
      if (!file) {
        return Response.json({ error: "File not found" }, { status: 404 });
      }

      if (file.expires_at! < new Date()) {
        await s3Hot.send(new DeleteObjectCommand({
          Bucket: HOT_BUCKET,
          Key: fileId,
        })).catch(console.error);

        return Response.json({ error: "File has expired" }, { status: 410 });
      }

      if (file.max_downloads !== null && file.download_count! >= file.max_downloads) {
        await s3Hot.send(new DeleteObjectCommand({
          Bucket: HOT_BUCKET,
          Key: fileId,
        })).catch(console.error);

        return Response.json({ error: "Download limit exceeded" }, { status: 410 });
      }

    } catch (error) {
      if (error instanceof Error && error.name === "NoSuchKey") {
        return Response.json({ error: "File not found" }, { status: 404 });
      }
      throw error;
    }

    return Response.json({
      filename: metadata.filename || fileId,
      contentType: metadata.contentType || "application/octet-stream"
    }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
