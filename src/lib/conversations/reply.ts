import { decryptSecret } from "@/lib/crypto/secrets";
import { prisma } from "@/lib/db";
import { persistOutboundAttachmentFiles } from "@/lib/attachments/storage";
import { formatMailboxAddress } from "@/lib/conversations/normalize";
import {
  extractEmailAddress,
  normalizeOutboundAttachments,
  parseMailboxForSend,
  parseRecipientList,
} from "@/lib/email/mailbox";
import { getProvider } from "@/providers/registry";
import type {
  DecryptedConfig,
  OutboundAttachment,
  ProviderId,
} from "@/providers/types";
import type { ProviderConnection } from "@/generated/prisma/client";

export function toDecryptedConfig(
  connection: ProviderConnection,
): DecryptedConfig {
  return {
    apiKey: decryptSecret(connection.apiKeyEncrypted),
    webhookSecret: connection.webhookSecretEncrypted
      ? decryptSecret(connection.webhookSecretEncrypted)
      : undefined,
    settings:
      connection.config && typeof connection.config === "object"
        ? (connection.config as Record<string, unknown>)
        : {},
  };
}

export async function getActiveConnectionForUser(
  userId: string,
  provider: ProviderId = "resend",
) {
  return prisma.providerConnection.findFirst({
    where: { userId, provider, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export function getFromAddress(config: DecryptedConfig): string {
  const fromEmail = config.settings.fromEmail;
  if (typeof fromEmail !== "string" || !fromEmail.includes("@")) {
    throw new Error("Provider connection is missing a valid fromEmail");
  }
  return fromEmail;
}

/** Reply from the mailbox that received the inbound mail; fall back to default from. */
export function resolveReplyFromAddress(
  inboundToAddresses: string,
  config: DecryptedConfig,
): string {
  for (const part of inboundToAddresses.split(",")) {
    try {
      return extractEmailAddress(part);
    } catch {
      // try next
    }
  }
  return getFromAddress(config);
}

export async function sendConversationReply(args: {
  userId: string;
  conversationId: string;
  to?: string;
  html?: string;
  text?: string;
  attachments?: OutboundAttachment[];
}) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: args.conversationId, userId: args.userId },
    include: {
      connection: true,
      messages: { orderBy: { sentAt: "desc" }, take: 20 },
    },
  });

  if (!conversation) {
    throw new Error("NOT_FOUND");
  }

  const lastInbound = conversation.messages.find((m) => m.direction === "inbound");
  if (!lastInbound) {
    throw new Error("No inbound message to reply to");
  }

  const config = toDecryptedConfig(conversation.connection);
  const provider = getProvider(conversation.connection.provider);
  const from = resolveReplyFromAddress(lastInbound.toAddresses, config);

  const replyTo = args.to?.trim()
    ? parseRecipientList(args.to)
    : [parseMailboxForSend(lastInbound.fromAddress, "recipient")];
  const subject = conversation.subject.startsWith("Re:")
    ? conversation.subject
    : `Re: ${conversation.subject}`;

  const inReplyTo =
    lastInbound.messageIdHeader ?? lastInbound.providerMessageId ?? undefined;

  const references: string[] = [];
  for (const msg of [...conversation.messages].reverse()) {
    const id = msg.messageIdHeader ?? msg.providerMessageId;
    if (id) references.push(id);
  }

  const bodyText = args.text?.trim() || stripHtml(args.html ?? "");
  const bodyHtml =
    args.html?.trim() ||
    (bodyText ? plainTextToEmailHtml(bodyText) : undefined);
  const attachments = normalizeOutboundAttachments(args.attachments);

  if (!bodyText && !bodyHtml) {
    throw new Error("Reply body is required");
  }

  const result = await provider.send(config, {
    from,
    to: replyTo,
    subject,
    html: bodyHtml,
    text: bodyText,
    inReplyTo,
    references: references.length > 0 ? references : undefined,
    attachments,
  });

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      connectionId: conversation.connectionId,
      direction: "outbound",
      fromAddress: formatMailboxAddress(from),
      toAddresses: replyTo.join(", "),
      subject,
      bodyHtml: bodyHtml,
      bodyText: bodyText,
      providerMessageId: result.providerMessageId,
      inReplyTo,
      sentAt: new Date(),
      attachments: {
        create: attachments.map((a) => ({
          filename: a.filename,
          contentType: a.contentType,
          size: a.size,
        })),
      },
    },
    include: { attachments: true },
  });

  if (message.attachments.length) {
    await persistOutboundAttachmentFiles(message.attachments, attachments);
  }

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: message.sentAt },
  });

  return message;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Fallback when the client only sends plain text. */
function plainTextToEmailHtml(text: string): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((block) => {
      const withBreaks = escapeHtml(block).replace(/\n/g, "<br>");
      return `<p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222222;">${withBreaks || "&nbsp;"}</p>`;
    })
    .join("");

  return [
    `<!DOCTYPE html>`,
    `<html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /></head>`,
    `<body style="margin:0;padding:0;background-color:#ffffff;">`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">`,
    `<tr><td style="padding:0;">${paragraphs}</td></tr></table>`,
    `</body></html>`,
  ].join("");
}
