-- Multi-mailbox: AppRole, Mailbox, MailboxGrant, Message.our_address / mailbox_id

CREATE TYPE "AppRole" AS ENUM ('super_admin', 'member');

ALTER TABLE "users" ADD COLUMN "role" "AppRole" NOT NULL DEFAULT 'super_admin';
ALTER TABLE "users" ADD COLUMN "preferred_mailbox_id" TEXT;

CREATE TABLE "mailboxes" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mailboxes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mailbox_grants" (
    "id" TEXT NOT NULL,
    "mailbox_id" TEXT NOT NULL,
    "user_id" TEXT,
    "team_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mailbox_grants_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "messages" ADD COLUMN "our_address" TEXT;
ALTER TABLE "messages" ADD COLUMN "mailbox_id" TEXT;

CREATE UNIQUE INDEX "mailboxes_connection_id_email_key" ON "mailboxes"("connection_id", "email");
CREATE INDEX "mailboxes_email_idx" ON "mailboxes"("email");

CREATE UNIQUE INDEX "mailbox_grants_mailbox_id_user_id_key" ON "mailbox_grants"("mailbox_id", "user_id");
CREATE UNIQUE INDEX "mailbox_grants_mailbox_id_team_id_key" ON "mailbox_grants"("mailbox_id", "team_id");
CREATE INDEX "mailbox_grants_user_id_idx" ON "mailbox_grants"("user_id");
CREATE INDEX "mailbox_grants_team_id_idx" ON "mailbox_grants"("team_id");

CREATE INDEX "messages_our_address_idx" ON "messages"("our_address");
CREATE INDEX "messages_mailbox_id_idx" ON "messages"("mailbox_id");

ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "provider_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mailbox_grants" ADD CONSTRAINT "mailbox_grants_mailbox_id_fkey" FOREIGN KEY ("mailbox_id") REFERENCES "mailboxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "mailbox_grants" ADD CONSTRAINT "mailbox_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_preferred_mailbox_id_fkey" FOREIGN KEY ("preferred_mailbox_id") REFERENCES "mailboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "messages" ADD CONSTRAINT "messages_mailbox_id_fkey" FOREIGN KEY ("mailbox_id") REFERENCES "mailboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed mailboxes from connection config.fromEmail
INSERT INTO "mailboxes" ("id", "connection_id", "email", "created_at")
SELECT
  md5(random()::text || clock_timestamp()::text || c.id)::text,
  c.id,
  lower(trim(c.config->>'fromEmail')),
  CURRENT_TIMESTAMP
FROM "provider_connections" c
WHERE c.config->>'fromEmail' IS NOT NULL
  AND trim(c.config->>'fromEmail') <> ''
  AND position('@' in c.config->>'fromEmail') > 0
ON CONFLICT ("connection_id", "email") DO NOTHING;

-- Grant each connection owner access to seeded mailboxes
INSERT INTO "mailbox_grants" ("id", "mailbox_id", "user_id", "created_at")
SELECT
  md5(random()::text || clock_timestamp()::text || m.id)::text,
  m.id,
  c."user_id",
  CURRENT_TIMESTAMP
FROM "mailboxes" m
JOIN "provider_connections" c ON c.id = m."connection_id"
ON CONFLICT ("mailbox_id", "user_id") DO NOTHING;

-- Prefer first mailbox per user when unset
UPDATE "users" u
SET "preferred_mailbox_id" = sub.mailbox_id
FROM (
  SELECT DISTINCT ON (c."user_id")
    c."user_id" AS user_id,
    m.id AS mailbox_id
  FROM "mailboxes" m
  JOIN "provider_connections" c ON c.id = m."connection_id"
  ORDER BY c."user_id", m."created_at" ASC
) sub
WHERE u.id = sub.user_id
  AND u."preferred_mailbox_id" IS NULL;

-- Backfill our_address for outbound (from address email)
UPDATE "messages" m
SET "our_address" = lower(
  CASE
    WHEN m."from_address" ~ '<' THEN
      trim(both ' >' from substring(m."from_address" from '<([^>]+)>'))
    ELSE trim(m."from_address")
  END
)
WHERE m.direction = 'outbound'
  AND m."our_address" IS NULL
  AND m."from_address" IS NOT NULL
  AND m."from_address" <> '';

-- Backfill our_address for inbound (first toAddresses email)
UPDATE "messages" m
SET "our_address" = lower(
  CASE
    WHEN split_part(m."to_addresses", ',', 1) ~ '<' THEN
      trim(both ' >' from substring(split_part(m."to_addresses", ',', 1) from '<([^>]+)>'))
    ELSE trim(split_part(m."to_addresses", ',', 1))
  END
)
WHERE m.direction = 'inbound'
  AND m."our_address" IS NULL
  AND m."to_addresses" IS NOT NULL
  AND m."to_addresses" <> '';

-- Link mailbox_id where our_address matches a mailbox on the same connection
UPDATE "messages" msg
SET "mailbox_id" = mb.id
FROM "mailboxes" mb
WHERE msg."mailbox_id" IS NULL
  AND msg."our_address" IS NOT NULL
  AND mb."connection_id" = msg."connection_id"
  AND mb.email = msg."our_address";
