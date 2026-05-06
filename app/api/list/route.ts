import { HOT_BUCKET, s3Hot } from "@/services/s3.service";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";

async function listObjects() {
  try {
    const response = await s3Hot.send(new ListObjectsV2Command({
      Bucket: HOT_BUCKET
    }));
    return response
  } catch (error) {
    console.log(error);
  }
}

export async function GET() {
  const res = await listObjects();
  return new Response(JSON.stringify(res), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
