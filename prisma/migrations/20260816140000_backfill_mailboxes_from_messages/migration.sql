-- Create mailboxes for distinct message our_address values that are missing,
-- grant connection owners access, and link messages to those mailboxes.

INSERT INTO "mailboxes" ("id", "connection_id", "email", "created_at")
SELECT
  md5(random()::text || clock_timestamp()::text || msg."connection_id" || msg."our_address")::text,
  msg."connection_id",
  msg."our_address",
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "connection_id", "our_address"
  FROM "messages"
  WHERE "our_address" IS NOT NULL
    AND trim("our_address") <> ''
    AND position('@' in "our_address") > 0
) msg
WHERE NOT EXISTS (
  SELECT 1
  FROM "mailboxes" mb
  WHERE mb."connection_id" = msg."connection_id"
    AND mb.email = lower(trim(msg."our_address"))
)
ON CONFLICT ("connection_id", "email") DO NOTHING;

-- Normalize any emails that slipped in with mixed case before unique conflict
-- (insert above uses our_address as stored; lower() for safety on new rows)
UPDATE "mailboxes"
SET email = lower(trim(email))
WHERE email <> lower(trim(email));

INSERT INTO "mailbox_grants" ("id", "mailbox_id", "user_id", "created_at")
SELECT
  md5(random()::text || clock_timestamp()::text || m.id)::text,
  m.id,
  c."user_id",
  CURRENT_TIMESTAMP
FROM "mailboxes" m
JOIN "provider_connections" c ON c.id = m."connection_id"
WHERE NOT EXISTS (
  SELECT 1
  FROM "mailbox_grants" g
  WHERE g."mailbox_id" = m.id
    AND g."user_id" = c."user_id"
)
ON CONFLICT ("mailbox_id", "user_id") DO NOTHING;

UPDATE "messages" msg
SET "mailbox_id" = mb.id
FROM "mailboxes" mb
WHERE msg."mailbox_id" IS NULL
  AND msg."our_address" IS NOT NULL
  AND mb."connection_id" = msg."connection_id"
  AND mb.email = lower(trim(msg."our_address"));

-- Prefer first mailbox when still unset (covers users who only had orphaned messages)
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
