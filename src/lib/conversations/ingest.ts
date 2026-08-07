import { prisma } from "@/lib/db";
import type { InboundEmail } from "@/providers/types";
import {
  formatAddresses,
  formatMailboxAddress,
  normalizeParticipants,
  normalizeSubject,
} from "@/lib/conversations/normalize";

function extractTokenIds(value?: string): string[] {
  if (!value) return [];
  const matches = value.match(/<[^>]+>|[^\s]+/g);
  return matches?.map((m) => m.trim()).filter(Boolean) ?? [];
}

async function findConversationByThreading(args: {
  userId: string;
  connectionId: string;
  inbound: InboundEmail;
}) {
  const { userId, connectionId, inbound } = args;
  const candidates = [
    ...extractTokenIds(inbound.inReplyTo),
    ...(inbound.references ?? []).flatMap(extractTokenIds),
  ];

  if (candidates.length === 0) return null;

  const existing = await prisma.message.findFirst({
    where: {
      connectionId,
      conversation: { userId },
      OR: [
        { messageIdHeader: { in: candidates } },
        { providerMessageId: { in: candidates } },
        { inReplyTo: { in: candidates } },
      ],
    },
    include: { conversation: true },
    orderBy: { sentAt: "desc" },
  });

  return existing?.conversation ?? null;
}

async function findConversationBySubjectParticipants(args: {
  userId: string;
  connectionId: string;
  inbound: InboundEmail;
}) {
  const { inbound } = args;
  const subject = normalizeSubject(inbound.subject);
  const participants = normalizeParticipants([
    inbound.from,
    ...inbound.to,
  ]);

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: args.userId,
      connectionId: args.connectionId,
      status: "open",
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  });

  return (
    conversations.find(
      (c) =>
        normalizeSubject(c.subject) === subject &&
        c.participants === participants,
    ) ?? null
  );
}

export async function ingestInboundEmail(args: {
  userId: string;
  connectionId: string;
  inbound: InboundEmail;
}) {
  const { userId, connectionId, inbound } = args;

  const existing = await prisma.message.findUnique({
    where: {
      connectionId_providerMessageId: {
        connectionId,
        providerMessageId: inbound.providerMessageId,
      },
    },
    include: { conversation: true },
  });

  if (existing) {
    return { conversation: existing.conversation, message: existing, created: false };
  }

  let conversation =
    (await findConversationByThreading({ userId, connectionId, inbound })) ??
    (await findConversationBySubjectParticipants({
      userId,
      connectionId,
      inbound,
    }));

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        userId,
        connectionId,
        subject: inbound.subject || "(no subject)",
        participants: normalizeParticipants([inbound.from, ...inbound.to]),
        lastMessageAt: inbound.receivedAt,
        unread: true,
      },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      connectionId,
      direction: "inbound",
      fromAddress: formatMailboxAddress(inbound.from),
      // Prefer the mailbox that actually received the mail (for reply-from)
      toAddresses: formatAddresses(
        inbound.receivedFor?.length ? inbound.receivedFor : inbound.to,
      ),
      subject: inbound.subject || "(no subject)",
      bodyHtml: inbound.html,
      bodyText: inbound.text,
      providerMessageId: inbound.providerMessageId,
      messageIdHeader: inbound.messageIdHeader,
      inReplyTo: inbound.inReplyTo,
      headers: inbound.rawHeaders ?? undefined,
      sentAt: inbound.receivedAt,
      attachments: {
        create: inbound.attachments.map((a) => ({
          filename: a.filename,
          contentType: a.contentType,
          size: a.size,
          providerAttachmentId: a.providerAttachmentId,
        })),
      },
    },
    include: { attachments: true },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessageAt: inbound.receivedAt,
      subject: conversation.subject || inbound.subject,
      unread: true,
    },
  });

  return { conversation, message, created: true };
}
