import { prisma } from "@/lib/db";
import { persistOutboundAttachmentFiles } from "@/lib/attachments/storage";
import { getProvider } from "@/providers/registry";
import type { OutboundAttachment } from "@/providers/types";
import {
  formatAddresses,
  formatMailboxAddress,
  normalizeParticipants,
} from "@/lib/conversations/normalize";
import {
  extractEmailAddress,
  normalizeOutboundAttachments,
  parseMailboxForSend,
  parseRecipientList,
} from "@/lib/email/mailbox";
import {
  getActiveConnectionForUser,
  getFromAddress,
  toDecryptedConfig,
} from "@/lib/conversations/reply";
import {
  getAccessibleMailboxes,
  resolveOutboundOurMailbox,
} from "@/lib/mailboxes/access";

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

export { extractEmailAddress, parseMailboxForSend, parseRecipientList };

export async function sendNewEmail(args: {
  userId: string;
  to: string;
  subject: string;
  from?: string;
  html?: string;
  text?: string;
  attachments?: OutboundAttachment[];
}) {
  const connection = await getActiveConnectionForUser(args.userId);
  if (!connection) {
    throw new Error(
      "No active email provider connected. Connect Resend in Settings first.",
    );
  }

  const to = parseRecipientList(args.to);
  const subject = args.subject.trim() || "(no subject)";
  const bodyText = args.text?.trim() || stripHtml(args.html ?? "");
  const bodyHtml =
    args.html?.trim() ||
    (bodyText ? plainTextToEmailHtml(bodyText) : undefined);
  const attachments = normalizeOutboundAttachments(args.attachments);

  if (!bodyText && !bodyHtml) {
    throw new Error("Email body is required");
  }

  const config = toDecryptedConfig(connection);
  const provider = getProvider(connection.provider);

  const accessible = await getAccessibleMailboxes(args.userId);
  let from: string;
  if (args.from?.trim()) {
    from = parseMailboxForSend(args.from, "from");
    const fromEmail = extractEmailAddress(from);
    const allowed = accessible.some((m) => m.email === fromEmail);
    if (!allowed) {
      throw new Error("From address is not an accessible mailbox");
    }
  } else {
    const preferred = accessible[0];
    from = preferred?.email ?? getFromAddress(config);
  }

  const result = await provider.send(config, {
    from,
    to,
    subject,
    html: bodyHtml,
    text: bodyText,
    attachments,
  });

  const now = new Date();
  const fromEmail = extractEmailAddress(from);
  const toEmails = to.map((t) => extractEmailAddress(t));
  const { ourAddress, mailboxId } = await resolveOutboundOurMailbox({
    connectionId: connection.id,
    from,
  });

  const conversation = await prisma.conversation.create({
    data: {
      userId: args.userId,
      connectionId: connection.id,
      subject,
      participants: normalizeParticipants([fromEmail, ...toEmails]),
      lastMessageAt: now,
      unread: false,
      messages: {
        create: {
          connectionId: connection.id,
          direction: "outbound",
          fromAddress: formatMailboxAddress(from),
          toAddresses: formatAddresses(to),
          ourAddress,
          mailboxId,
          subject,
          bodyHtml: bodyHtml,
          bodyText: bodyText,
          providerMessageId: result.providerMessageId,
          sentAt: now,
          attachments: {
            create: attachments.map((a) => ({
              filename: a.filename,
              contentType: a.contentType,
              size: a.size,
            })),
          },
        },
      },
    },
    include: {
      messages: {
        include: { attachments: true },
      },
    },
  });

  const createdMessage = conversation.messages[0];
  if (createdMessage?.attachments.length) {
    await persistOutboundAttachmentFiles(
      createdMessage.attachments,
      attachments,
    );
  }

  return conversation;
}
