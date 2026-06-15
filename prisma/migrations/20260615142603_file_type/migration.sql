-- CreateEnum
CREATE TYPE "UploadType" AS ENUM ('USER', 'SERVICE');

-- AlterTable
ALTER TABLE "files" ADD COLUMN     "type" "UploadType" NOT NULL DEFAULT 'USER';
