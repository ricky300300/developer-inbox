-- Private Vercel Blob pathname for attachment bytes. Null until copied.

ALTER TABLE "attachments" ADD COLUMN "blob_pathname" TEXT;
