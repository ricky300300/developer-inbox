import { prisma } from "@/lib/db";

export type ConversationFolder = "inbox" | "sent";

export const CONVERSATIONS_PAGE_SIZE = 50;

function folderWhere(folder: ConversationFolder | undefined) {
  if (folder === "sent") {
    return {
      messages: { some: { direction: "outbound" as const } },
    };
  }
  return {};
}

function conversationListWhere(args: {
  userId: string;
  query?: string;
  folder?: ConversationFolder;
}) {
  const q = args.query?.trim();
  return {
    userId: args.userId,
    status: "open" as const,
    ...folderWhere(args.folder),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: "insensitive" as const } },
            { participants: { contains: q, mode: "insensitive" as const } },
            {
              messages: {
                some: {
                  OR: [
                    { bodyText: { contains: q, mode: "insensitive" as const } },
                    {
                      fromAddress: {
                        contains: q,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : {}),
  };
}

export async function listConversations(args: {
  userId: string;
  query?: string;
  folder?: ConversationFolder;
  take?: number;
  skip?: number;
}) {
  const {
    userId,
    query,
    folder = "inbox",
    take = CONVERSATIONS_PAGE_SIZE,
    skip = 0,
  } = args;

  return prisma.conversation.findMany({
    where: conversationListWhere({ userId, query, folder }),
    orderBy: { lastMessageAt: "desc" },
    take,
    skip,
    include: {
      _count: {
        select: { messages: true },
      },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: {
          bodyText: true,
          fromAddress: true,
          direction: true,
          sentAt: true,
          attachments: {
            select: { id: true, filename: true, size: true },
            take: 3,
          },
        },
      },
    },
  });
}

export async function markConversationRead(args: {
  userId: string;
  conversationId: string;
}) {
  await prisma.conversation.updateMany({
    where: {
      id: args.conversationId,
      userId: args.userId,
      unread: true,
    },
    data: { unread: false },
  });
}

export async function countConversations(args: {
  userId: string;
  folder?: ConversationFolder;
  query?: string;
}) {
  const { userId, folder = "inbox", query } = args;
  return prisma.conversation.count({
    where: conversationListWhere({ userId, query, folder }),
  });
}

export async function getConversationForUser(args: {
  userId: string;
  conversationId: string;
}) {
  return prisma.conversation.findFirst({
    where: {
      id: args.conversationId,
      userId: args.userId,
    },
    include: {
      connection: true,
      messages: {
        orderBy: { sentAt: "asc" },
        include: { attachments: true },
      },
    },
  });
}
