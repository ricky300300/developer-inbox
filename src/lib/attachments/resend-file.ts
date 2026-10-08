import { Resend } from "resend";

export async function fetchResendAttachmentBytes(args: {
  resend: Resend;
  direction: "inbound" | "outbound";
  emailId: string;
  filename: string;
  providerAttachmentId: string | null;
}): Promise<{
  body: Buffer;
  providerAttachmentId: string;
  contentType: string | null;
  filename: string;
}> {
  const providerAttachmentId = await resolveProviderAttachmentId(args);
  if (!providerAttachmentId) {
    throw new Error("Attachment file is not available for download");
  }

  const result =
    args.direction === "inbound"
      ? await args.resend.emails.receiving.attachments.get({
          emailId: args.emailId,
          id: providerAttachmentId,
        })
      : await args.resend.emails.attachments.get({
          emailId: args.emailId,
          id: providerAttachmentId,
        });

  if (result.error || !result.data?.download_url) {
    throw new Error(
      result.error?.message ?? "Failed to fetch attachment from provider",
    );
  }

  const fileRes = await fetch(result.data.download_url);
  if (!fileRes.ok) {
    throw new Error("Failed to download attachment content");
  }

  return {
    body: Buffer.from(await fileRes.arrayBuffer()),
    providerAttachmentId,
    contentType: result.data.content_type ?? null,
    filename: result.data.filename || args.filename || "attachment",
  };
}

async function resolveProviderAttachmentId(args: {
  resend: Resend;
  direction: "inbound" | "outbound";
  emailId: string;
  filename: string;
  providerAttachmentId: string | null;
}): Promise<string | null> {
  if (args.providerAttachmentId) return args.providerAttachmentId;

  const list =
    args.direction === "inbound"
      ? await args.resend.emails.receiving.attachments.list({
          emailId: args.emailId,
        })
      : await args.resend.emails.attachments.list({ emailId: args.emailId });

  const match = list.data?.data?.find((item) => item.filename === args.filename);
  return match?.id ?? list.data?.data?.[0]?.id ?? null;
}
