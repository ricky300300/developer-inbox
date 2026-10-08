import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { toDecryptedConfig } from "@/lib/conversations/reply";
import { fetchResendAttachmentBytes } from "@/lib/attachments/resend-file";
import {
  attachmentBlobPath,
  ensureMessageMailboxId,
  isBlobConfigured,
  readBlobAttachment,
  readDiskAttachment,
  readLegacyDiskAttachment,
  storeAttachmentBytes,
} from "@/lib/attachments/storage";

export type ResolvedAttachment = {
  filename: string;
  contentType: string;
  body: Buffer;
};

export async function resolveAttachmentDownload(args: {
  userId: string;
  attachmentId: string;
}): Promise<ResolvedAttachment | null> {
  const attachment = await prisma.attachment.findFirst({
    where: {
      id: args.attachmentId,
      message: { conversation: { userId: args.userId } },
    },
    include: {
      message: {
        include: {
          conversation: {
            include: { connection: true },
          },
        },
      },
    },
  });

  if (!attachment) return null;

  const filename = attachment.filename || "attachment";
  const contentType = attachment.contentType || "application/octet-stream";
  const packaged = (body: Buffer, type = contentType, name = filename) => ({
    filename: name,
    contentType: type || "application/octet-stream",
    body,
  });

  if (attachment.blobPathname && isBlobConfigured()) {
    try {
      const stored = await readBlobAttachment(attachment.blobPathname);
      if (stored) return packaged(stored);
    } catch (error) {
      console.error("[attachments] blob read failed", {
        attachmentId: attachment.id,
        error,
      });
    }
  }

  if (!isBlobConfigured()) {
    const legacy = await readLegacyDiskAttachment(attachment.id);
    if (legacy) return packaged(legacy);
  }

  const message = attachment.message;
  const mailboxId = await ensureMessageMailboxId(message);

  if (!isBlobConfigured() && mailboxId) {
    const disk = await readDiskAttachment(
      attachmentBlobPath({
        connectionId: message.connectionId,
        mailboxId,
        attachmentId: attachment.id,
        filename: attachment.filename,
      }),
    );
    if (disk) return packaged(disk);
  }

  const connection = message.conversation.connection;
  const config = toDecryptedConfig(connection);
  const resend = new Resend(config.apiKey);
  const file = await fetchResendAttachmentBytes({
    resend,
    direction: message.direction,
    emailId: message.providerMessageId,
    filename: attachment.filename,
    providerAttachmentId: attachment.providerAttachmentId,
  });

  if (file.providerAttachmentId !== attachment.providerAttachmentId) {
    await prisma.attachment.update({
      where: { id: attachment.id },
      data: { providerAttachmentId: file.providerAttachmentId },
    });
  }

  if (mailboxId) {
    try {
      await storeAttachmentBytes({
        connectionId: message.connectionId,
        mailboxId,
        attachmentId: attachment.id,
        filename: attachment.filename,
        contentType: attachment.contentType ?? file.contentType,
        body: file.body,
      });
    } catch (error) {
      console.error("[attachments] download backfill failed", {
        attachmentId: attachment.id,
        error,
      });
    }
  }

  return packaged(
    file.body,
    attachment.contentType || file.contentType || "application/octet-stream",
    attachment.filename || file.filename,
  );
}
