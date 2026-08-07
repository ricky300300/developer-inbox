import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { toDecryptedConfig } from "@/lib/conversations/reply";
import { readLocalAttachment } from "@/lib/attachments/storage";

export type ResolvedAttachment = {
  filename: string;
  contentType: string;
  body: Buffer;
};

async function resolveProviderAttachmentId(args: {
  resend: Resend;
  direction: "inbound" | "outbound";
  emailId: string;
  filename: string;
  currentId: string | null;
}): Promise<string | null> {
  if (args.currentId) return args.currentId;

  const list =
    args.direction === "inbound"
      ? await args.resend.emails.receiving.attachments.list({
          emailId: args.emailId,
        })
      : await args.resend.emails.attachments.list({ emailId: args.emailId });

  const match = list.data?.data?.find(
    (item) => item.filename === args.filename,
  );
  return match?.id ?? list.data?.data?.[0]?.id ?? null;
}

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

  const local = await readLocalAttachment(attachment.id);
  if (local) {
    return {
      filename: attachment.filename,
      contentType: attachment.contentType || "application/octet-stream",
      body: local,
    };
  }

  const connection = attachment.message.conversation.connection;
  const config = toDecryptedConfig(connection);
  const resend = new Resend(config.apiKey);
  const emailId = attachment.message.providerMessageId;
  const direction = attachment.message.direction;

  const providerAttachmentId = await resolveProviderAttachmentId({
    resend,
    direction,
    emailId,
    filename: attachment.filename,
    currentId: attachment.providerAttachmentId,
  });

  if (!providerAttachmentId) {
    throw new Error("Attachment file is not available for download");
  }

  if (
    providerAttachmentId &&
    providerAttachmentId !== attachment.providerAttachmentId
  ) {
    await prisma.attachment.update({
      where: { id: attachment.id },
      data: { providerAttachmentId },
    });
  }

  const result =
    direction === "inbound"
      ? await resend.emails.receiving.attachments.get({
          emailId,
          id: providerAttachmentId,
        })
      : await resend.emails.attachments.get({
          emailId,
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

  const body = Buffer.from(await fileRes.arrayBuffer());
  return {
    filename: attachment.filename || result.data.filename || "attachment",
    contentType:
      attachment.contentType ||
      result.data.content_type ||
      "application/octet-stream",
    body,
  };
}
