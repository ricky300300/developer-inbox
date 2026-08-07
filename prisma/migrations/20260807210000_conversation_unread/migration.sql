-- AlterTable
ALTER TABLE "conversations" ADD COLUMN "unread" BOOLEAN NOT NULL DEFAULT false;

-- Mark threads whose latest message is inbound as unread
UPDATE "conversations" AS c
SET "unread" = true
WHERE EXISTS (
  SELECT 1
  FROM "messages" AS m
  WHERE m."conversation_id" = c."id"
    AND m."direction" = 'inbound'
    AND m."sent_at" = (
      SELECT MAX(m2."sent_at")
      FROM "messages" AS m2
      WHERE m2."conversation_id" = c."id"
    )
);

-- CreateIndex
CREATE INDEX "conversations_user_id_unread_idx" ON "conversations"("user_id", "unread");
