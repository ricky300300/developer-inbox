import { Resend } from "resend";
import type {
  AttachmentMeta,
  DecryptedConfig,
  EmailAddress,
  InboundEmail,
} from "@/providers/types";

type ResendWebhookEvent = {
  type: string;
  created_at?: string;
  data?: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    message_id?: string;
    attachments?: Array<{
      id?: string;
      filename?: string;
      content_type?: string;
      content_disposition?: string;
      content_id?: string;
    }>;
  };
};

function parseAddress(raw: string): EmailAddress {
  const match = raw.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  if (match) {
    const name = match[1]?.trim();
    const email = match[2]?.trim().toLowerCase();
    return name ? { email, name } : { email };
  }
  return { email: raw.trim().toLowerCase() };
}

function headerValue(
  headers: Record<string, string> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const lower = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === lower) return value;
  }
  return undefined;
}

export async function handleResendWebhook(args: {
  request: Request;
  config: DecryptedConfig;
  webhookSecret?: string;
}): Promise<InboundEmail | null> {
  const { request, config, webhookSecret } = args;
  const secret = webhookSecret ?? config.webhookSecret;
  if (!secret) {
    throw new Error("Resend webhook secret is not configured");
  }

  const payload = await request.text();
  const resend = new Resend(config.apiKey);

  let event: ResendWebhookEvent;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: secret,
    }) as ResendWebhookEvent;
  } catch {
    throw new Error("INVALID_WEBHOOK_SIGNATURE");
  }

  if (event.type !== "email.received") {
    return null;
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    throw new Error("Missing email_id in Resend webhook payload");
  }

  const { data: received, error } = await resend.emails.receiving.get(emailId);
  if (error || !received) {
    throw new Error(error?.message ?? "Failed to fetch received email from Resend");
  }

  const headers =
    (received.headers as Record<string, string> | undefined) ?? undefined;

  const fromRaw =
    typeof received.from === "string"
      ? received.from
      : event.data?.from ?? "unknown@unknown";
  const toRaw: string[] = Array.isArray(received.to)
    ? received.to.map(String)
    : event.data?.to ?? [];

  const attachments: AttachmentMeta[] = [];

  if (received.attachments?.length) {
    for (const item of received.attachments) {
      attachments.push({
        filename: item.filename ?? "attachment",
        contentType: item.content_type ?? undefined,
        size: item.size ?? undefined,
        providerAttachmentId: item.id,
      });
    }
  } else {
    try {
      const { data: attachmentList } =
        await resend.emails.receiving.attachments.list({ emailId });
      if (attachmentList?.data) {
        for (const item of attachmentList.data) {
          attachments.push({
            filename: item.filename ?? "attachment",
            contentType: item.content_type ?? undefined,
            size: item.size ?? undefined,
            providerAttachmentId: item.id,
          });
        }
      }
    } catch {
      if (event.data?.attachments) {
        for (const item of event.data.attachments) {
          attachments.push({
            filename: item.filename ?? "attachment",
            contentType: item.content_type ?? undefined,
            providerAttachmentId: item.id,
          });
        }
      }
    }
  }

  const messageIdHeader =
    headerValue(headers, "message-id") ??
    received.message_id ??
    event.data?.message_id ??
    undefined;
  const inReplyTo = headerValue(headers, "in-reply-to");
  const referencesRaw = headerValue(headers, "references");
  const references = referencesRaw
    ? referencesRaw.split(/\s+/).filter(Boolean)
    : undefined;

  return {
    providerMessageId: emailId,
    messageIdHeader,
    inReplyTo,
    references,
    from: parseAddress(fromRaw),
    to: toRaw.map(parseAddress),
    subject: received.subject ?? event.data?.subject ?? "(no subject)",
    html: received.html ?? undefined,
    text: received.text ?? undefined,
    attachments,
    receivedAt: event.created_at ? new Date(event.created_at) : new Date(),
    rawHeaders: headers,
  };
}
