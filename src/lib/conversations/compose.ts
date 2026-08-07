import { prisma } from "@/lib/db";
import { getProvider } from "@/providers/registry";
import {
  formatAddresses,
  normalizeParticipants,
} from "@/lib/conversations/normalize";
import {
  getActiveConnectionForUser,
  getFromAddress,
  toDecryptedConfig,
} from "@/lib/conversations/reply";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseEmailAddress(raw: string, label = "email"): string {
  const email = raw.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    throw new Error(`Invalid ${label} address${email ? `: ${email}` : ""}`);
  }
  return email;
}

export function parseRecipientList(raw: string): string[] {
  const emails = raw
    .split(/[,;]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const unique = [...new Set(emails)];
  for (const email of unique) {
    if (!EMAIL_RE.test(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }
  }
  if (unique.length === 0) {
    throw new Error("At least one recipient is required");
  }
  return unique;
}

export async function sendNewEmail(args: {
  userId: string;
  to: string;
  subject: string;
  from?: string;
  html?: string;
  text?: string;
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

  if (!bodyText && !bodyHtml) {
    throw new Error("Email body is required");
  }

  const config = toDecryptedConfig(connection);
  const provider = getProvider(connection.provider);
  const from = args.from?.trim()
    ? parseEmailAddress(args.from, "from")
    : getFromAddress(config);

  const result = await provider.send(config, {
    from,
    to,
    subject,
    html: bodyHtml,
    text: bodyText,
  });

  const now = new Date();
  const conversation = await prisma.conversation.create({
    data: {
      userId: args.userId,
      connectionId: connection.id,
      subject,
      participants: normalizeParticipants([from, ...to]),
      lastMessageAt: now,
      messages: {
        create: {
          connectionId: connection.id,
          direction: "outbound",
          fromAddress: from,
          toAddresses: formatAddresses(to),
          subject,
          bodyHtml: bodyHtml,
          bodyText: bodyText,
          providerMessageId: result.providerMessageId,
          sentAt: now,
        },
      },
    },
    include: {
      messages: true,
    },
  });

  return conversation;
}
