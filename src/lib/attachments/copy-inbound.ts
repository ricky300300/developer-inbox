import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { toDecryptedConfig } from "@/lib/conversations/reply";
import { fetchResendAttachmentBytes } from "@/lib/attachments/resend-file";
import {
  attachmentBlobPath,
  ensureMessageMailboxId,
  isBlobConfigured,
  readDiskAttachment,
  storeAttachmentBytes,
} from "@/lib/attachments/storage";

/** Copy attachments that are not in Blob yet. Safe to rerun after a webhook retry. */
export async function copyMessageAttachmentsToBlob(
  messageId: string,
): Promise<void> {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      attachments: { where: { blobPathname: null } },
      conversation: { include: { connection: true } },
    },
  });
  if (!message || message.attachments.length === 0) return;

  const mailboxId = await ensureMessageMailboxId(message);
  if (!mailboxId) return;

  const pending = [];
  for (const attachment of message.attachments) {
    if (!isBlobConfigured()) {
      const existing = await readDiskAttachment(
        attachmentBlobPath({
          connectionId: message.connectionId,
          mailboxId,
          attachmentId: attachment.id,
          filename: attachment.filename,
        }),
      );
      if (existing) continue;
    }
    pending.push(attachment);
  }
  if (pending.length === 0) return;

  const config = toDecryptedConfig(message.conversation.connection);
  const resend = new Resend(config.apiKey);

  for (const attachment of pending) {
    try {
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

      await storeAttachmentBytes({
        connectionId: message.connectionId,
        mailboxId,
        attachmentId: attachment.id,
        filename: attachment.filename,
        contentType: attachment.contentType ?? file.contentType,
        body: file.body,
      });
    } catch (error) {
      console.error("[attachments] inbound copy failed", {
        attachmentId: attachment.id,
        error,
      });
    }
  }
}
