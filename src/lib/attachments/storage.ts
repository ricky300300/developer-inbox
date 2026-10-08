import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { BlobNotFoundError, get, put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { ensureMailboxWithOwnerGrant } from "@/lib/mailboxes/access";
import type { OutboundAttachment } from "@/providers/types";

const DATA_ROOT = path.join(process.cwd(), ".data");
const LEGACY_ROOT = path.join(DATA_ROOT, "attachments");
const MAX_FILENAME_LENGTH = 180;

export function isBlobConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID,
  );
}

/** Basename safe to use as the last blob segment. */
export function safeAttachmentFilename(filename: string): string {
  const raw = filename.split(/[/\\]/).pop()?.trim() || "attachment";
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[?#%]/g, "_")
    .replace(/^\.+/, "");
  if (!cleaned) return "attachment";
  if (cleaned.length <= MAX_FILENAME_LENGTH) return cleaned;

  const dot = cleaned.lastIndexOf(".");
  const ext =
    dot > 0 && cleaned.length - dot <= 16 ? cleaned.slice(dot) : "";
  const stem = cleaned.slice(0, MAX_FILENAME_LENGTH - ext.length);
  return `${stem}${ext}` || "attachment";
}

export function attachmentBlobPath(args: {
  connectionId: string;
  mailboxId: string;
  attachmentId: string;
  filename: string;
}): string {
  return [
    "connections",
    args.connectionId,
    "mailboxes",
    args.mailboxId,
    args.attachmentId,
    safeAttachmentFilename(args.filename),
  ].join("/");
}

type MailboxMessage = {
  id: string;
  connectionId: string;
  mailboxId: string | null;
  ourAddress: string | null;
};

/**
 * Mailbox id for the blob path. Creates the mailbox from ourAddress when the
 * row was never written. Returns null only when there is no email to file under.
 */
export async function ensureMessageMailboxId(
  message: MailboxMessage,
): Promise<string | null> {
  if (message.mailboxId) return message.mailboxId;
  const email = message.ourAddress?.trim();
  if (!email) return null;

  const connection = await prisma.providerConnection.findUnique({
    where: { id: message.connectionId },
    select: { userId: true },
  });
  if (!connection) return null;

  try {
    const mailbox = await ensureMailboxWithOwnerGrant({
      connectionId: message.connectionId,
      email,
      ownerUserId: connection.userId,
    });
    await prisma.message.update({
      where: { id: message.id },
      data: { mailboxId: mailbox.id },
    });
    return mailbox.id;
  } catch (error) {
    console.error("[attachments] could not ensure mailbox", error);
    return null;
  }
}

function diskFilePath(relativePath: string): string {
  const segments = relativePath.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === "..")) {
    throw new Error("Invalid attachment path");
  }
  return path.join(DATA_ROOT, ...segments);
}

async function writeDiskAttachment(
  relativePath: string,
  body: Buffer,
): Promise<void> {
  const filePath = diskFilePath(relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, body);
}

export async function readDiskAttachment(
  relativePath: string,
): Promise<Buffer | null> {
  try {
    return await readFile(diskFilePath(relativePath));
  } catch {
    return null;
  }
}

/** Files written before blob pathnames existed: `.data/attachments/{id}`. */
export async function readLegacyDiskAttachment(
  attachmentId: string,
): Promise<Buffer | null> {
  try {
    return await readFile(path.join(LEGACY_ROOT, attachmentId));
  } catch {
    return null;
  }
}

export async function readBlobAttachment(
  pathname: string,
): Promise<Buffer | null> {
  if (!isBlobConfigured()) return null;
  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) return null;
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  } catch (error) {
    if (error instanceof BlobNotFoundError) return null;
    throw error;
  }
}

export async function storeAttachmentBytes(args: {
  connectionId: string;
  mailboxId: string;
  attachmentId: string;
  filename: string;
  contentType?: string | null;
  body: Buffer;
}): Promise<void> {
  const pathname = attachmentBlobPath(args);
  if (!isBlobConfigured()) {
    await writeDiskAttachment(pathname, args.body);
    return;
  }

  await put(pathname, args.body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: args.contentType || "application/octet-stream",
  });
  await prisma.attachment.update({
    where: { id: args.attachmentId },
    data: { blobPathname: pathname },
  });
}

export async function persistOutboundAttachmentFiles(
  message: MailboxMessage,
  records: Array<{ id: string; filename: string; contentType: string | null }>,
  payloads: OutboundAttachment[],
): Promise<void> {
  if (records.length === 0 || payloads.length === 0) return;

  const mailboxId = await ensureMessageMailboxId(message);
  if (!mailboxId) return;

  for (let i = 0; i < records.length; i++) {
    const record = records[i]!;
    const payload =
      payloads[i]?.filename === record.filename
        ? payloads[i]
        : payloads.find((item) => item.filename === record.filename);
    if (!payload?.content) continue;

    try {
      await storeAttachmentBytes({
        connectionId: message.connectionId,
        mailboxId,
        attachmentId: record.id,
        filename: record.filename,
        contentType: record.contentType ?? payload.contentType,
        body: Buffer.from(payload.content, "base64"),
      });
    } catch (error) {
      console.error("[attachments] outbound store failed", {
        attachmentId: record.id,
        error,
      });
    }
  }
}
