-- AlterTable
ALTER TABLE "files" ADD COLUMN     "folder_id" TEXT;

-- AlterTable
ALTER TABLE "multipart_uploads" ADD COLUMN     "folder_id" TEXT;
