-- CreateTable
CREATE TABLE "secrets" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),
    "max_views" INTEGER NOT NULL,
    "view_count" INTEGER DEFAULT 0,
    "password_hash" TEXT,
    "user_id" INTEGER,

    CONSTRAINT "secrets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "secrets" ADD CONSTRAINT "secrets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
