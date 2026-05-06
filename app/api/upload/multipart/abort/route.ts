import { s3Hot, HOT_BUCKET } from "@/services/s3.service";
import { AbortMultipartUploadCommand } from "@aws-sdk/client-s3";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { fileId, folderId, uploadId } = await request.json();

    if (!fileId || !folderId || !uploadId) {
      return Response.json({ error: "Missing fileId, folderId, or uploadId" }, { status: 400 });
    }

    await s3Hot.send(new AbortMultipartUploadCommand({
      Bucket: HOT_BUCKET,
      Key: folderId + "/" + fileId,
      UploadId: uploadId,
    }));

    await prisma.files.delete({
      where: { id: fileId },
    }).catch(console.error);

    return Response.json({ success: true });
  } catch (error) {
    console.error("Abort error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
