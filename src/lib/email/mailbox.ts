import type { OutboundAttachment } from "@/providers/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function extractEmailAddress(raw: string, label = "email"): string {
  const value = raw.trim();
  if (!value) {
    throw new Error(`Invalid ${label} address`);
  }

  const angled = value.match(/<\s*([^>]+@[^>]+)\s*>/);
  const email = (angled?.[1] ?? value).trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    throw new Error(`Invalid ${label} address: ${value}`);
  }
  return email;
}

/** Keep display form for sending when present; otherwise bare email. */
export function parseMailboxForSend(raw: string, label = "email"): string {
  const value = raw.trim();
  if (!value) throw new Error(`Invalid ${label} address`);

  const angled = value.match(
    /^(?:"([^"]+)"|([^<]*?))\s*<\s*([^>]+@[^>]+)\s*>$/,
  );
  if (angled) {
    const email = (angled[3] ?? "").trim().toLowerCase();
    const name = (angled[1] ?? angled[2] ?? "").trim();
    if (!EMAIL_RE.test(email)) {
      throw new Error(`Invalid ${label} address: ${value}`);
    }
    return name ? `${name} <${email}>` : email;
  }

  return extractEmailAddress(value, label);
}

export function parseRecipientList(raw: string): string[] {
  const parts = raw
    .split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    const mailbox = parseMailboxForSend(part, "recipient");
    const email = extractEmailAddress(mailbox);
    if (seen.has(email)) continue;
    seen.add(email);
    unique.push(mailbox);
  }

  if (unique.length === 0) {
    throw new Error("At least one recipient is required");
  }
  return unique;
}

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const MAX_ATTACHMENTS = 10;

export function normalizeOutboundAttachments(
  attachments: OutboundAttachment[] | undefined,
): OutboundAttachment[] {
  if (!attachments?.length) return [];
  if (attachments.length > MAX_ATTACHMENTS) {
    throw new Error(`Too many attachments (max ${MAX_ATTACHMENTS})`);
  }

  let total = 0;
  const out: OutboundAttachment[] = [];
  for (const a of attachments) {
    const filename = a.filename?.trim();
    const content = a.content?.trim();
    if (!filename || !content) {
      throw new Error("Each attachment needs a filename and content");
    }
    const size = a.size ?? Math.floor((content.length * 3) / 4);
    total += size;
    if (total > MAX_ATTACHMENT_BYTES) {
      throw new Error("Attachments exceed the 25 MB limit");
    }
    out.push({
      filename,
      content,
      contentType: a.contentType,
      size,
    });
  }
  return out;
}
