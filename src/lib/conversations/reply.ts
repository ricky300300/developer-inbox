import { decryptSecret } from "@/lib/crypto/secrets";
import { prisma } from "@/lib/db";
import { getProvider } from "@/providers/registry";
import type { DecryptedConfig, ProviderId } from "@/providers/types";
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

export async function sendConversationReply(args: {
  userId: string;
  conversationId: string;
  html?: string;
  text?: string;
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
  const from = getFromAddress(config);

  const replyTo = lastInbound.fromAddress;
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
  const bodyHtml = args.html?.trim() || undefined;

  if (!bodyText && !bodyHtml) {
    throw new Error("Reply body is required");
  }

  const result = await provider.send(config, {
    from,
    to: [replyTo],
    subject,
    html: bodyHtml,
    text: bodyText,
    inReplyTo,
    references: references.length > 0 ? references : undefined,
  });

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      connectionId: conversation.connectionId,
      direction: "outbound",
      fromAddress: from,
      toAddresses: replyTo,
      subject,
      bodyHtml: bodyHtml,
      bodyText: bodyText,
      providerMessageId: result.providerMessageId,
      inReplyTo,
      sentAt: new Date(),
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { lastMessageAt: message.sentAt },
  });

  return message;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
