import { Resend } from "resend";
import type { CreateEmailOptions } from "resend";
import type { DecryptedConfig, OutboundMessage, SendResult } from "@/providers/types";

export async function sendWithResend(
  config: DecryptedConfig,
  message: OutboundMessage,
): Promise<SendResult> {
  const resend = new Resend(config.apiKey);

  const headers: Record<string, string> = {};
  if (message.inReplyTo) {
    headers["In-Reply-To"] = message.inReplyTo;
  }
  if (message.references && message.references.length > 0) {
    headers.References = message.references.join(" ");
  }

  const html = message.html?.trim();
  const text = message.text?.trim();

  if (!html && !text) {
    throw new Error("Email body is required");
  }

  const attachments = message.attachments?.map((a) => ({
    filename: a.filename,
    content: Buffer.from(a.content, "base64"),
    ...(a.contentType ? { contentType: a.contentType } : {}),
  }));

  const payload = {
    from: message.from,
    to: message.to,
    subject: message.subject,
    ...(message.cc ? { cc: message.cc } : {}),
    ...(html ? { html } : { text: text! }),
    ...(html && text ? { text } : {}),
    ...(attachments && attachments.length > 0 ? { attachments } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  } satisfies CreateEmailOptions;

  const { data, error } = await resend.emails.send(payload);

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to send email via Resend");
  }

  return { providerMessageId: data.id };
}
