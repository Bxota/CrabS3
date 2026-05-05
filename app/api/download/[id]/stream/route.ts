import { s3Hot, s3Cold, HOT_BUCKET, COLD_BUCKET } from "@/services/s3.service";
import { DeleteObjectsCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { sendDownloadNotificationEmail } from "@/services/mail.service";

const getFileData = async (fileId: string) => {
  try {
    const url = await s3Hot.send(new GetObjectCommand({
      Bucket: HOT_BUCKET,
      Key: fileId,
    }));

    return url;
  } catch (err: any) {
    if (err?.name !== "NotFound" && err?.name !== "NoSuchKey") {
      throw err;
    }
  }

  try {
    const url = await s3Cold.send(new GetObjectCommand({
      Bucket: COLD_BUCKET,
      Key: fileId,
    }));

    return url;
  } catch (err: any) {
    if (err?.name !== "NotFound" && err?.name !== "NoSuchKey") {
      throw err;
    }
  }

  return null;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const password = searchParams.get("password") || ""
    const fileId = (await params).id

    let file;
    try {
      file = await prisma.files.findUnique({
        where: { id: fileId },
        select: { password_hash: true, filename: true, size: true, email_sender: true, max_downloads: true },
      });

      if (!file) {
        return Response.json({ error: "File not found" }, { status: 404 });
      }

      // Check password if file is protected
      if (file.password_hash) {
        if (!password) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const isPasswordValid = await bcrypt.compare(password, file.password_hash);
        if (!isPasswordValid) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "NoSuchKey") {
        return Response.json({ error: "File not found" }, { status: 404 });
      }
      throw error;
    }

    const metadata: { filename?: string; contentType?: string; maxDownloads?: string; email_sender?: string, size?: string } = {
      filename: file.filename,
      contentType: "application/octet-stream",
      maxDownloads: file.max_downloads?.toString(),
      email_sender: file.email_sender || undefined,
      size: file.size?.toString() || undefined,
    };

    if (!metadata) {
      return Response.json({ error: "File metadata not found" }, { status: 404 });
    }

    const fileResponse = await getFileData(fileId);

    if (!fileResponse) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    if (metadata.maxDownloads) {
      const maxDownloads = Number.parseInt(metadata.maxDownloads);
      if (Number.isNaN(maxDownloads) || maxDownloads <= 0) {
        return Response.json({ error: "Invalid max downloads value" }, { status: 500 });
      }

      const newMaxDownloads = maxDownloads - 1;

      if (newMaxDownloads === 0) {
        await s3Hot.send(new DeleteObjectsCommand({
          Bucket: HOT_BUCKET,
          Delete: {
            Objects: [
              { Key: fileId },
            ],
          },
        }));
      }
    }

    await prisma.files.update({
      where: { id: fileId },
      data: {
        download_count: { increment: 1 },
      },
    }).catch(console.error);
    if (metadata.email_sender)
      await sendDownloadNotificationEmail(metadata.email_sender || "", fileId);

    return new Response(fileResponse.Body?.transformToWebStream(), {
      headers: {
        "Content-Type": metadata.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(metadata.filename || "download")}"`,
        ...(metadata.size && { "Content-Length": metadata.size }),
      },
    })
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
