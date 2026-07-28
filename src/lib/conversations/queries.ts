import { prisma } from "@/lib/db";

export async function listConversations(args: {
  userId: string;
  query?: string;
  take?: number;
}) {
  const { userId, query, take = 50 } = args;
  const q = query?.trim();

  return prisma.conversation.findMany({
    where: {
      userId,
      status: "open",
      ...(q
        ? {
            OR: [
              { subject: { contains: q, mode: "insensitive" } },
              { participants: { contains: q, mode: "insensitive" } },
              {
                messages: {
                  some: {
                    OR: [
                      { bodyText: { contains: q, mode: "insensitive" } },
                      { fromAddress: { contains: q, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    },
    orderBy: { lastMessageAt: "desc" },
    take,
    include: {
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: {
          bodyText: true,
          fromAddress: true,
          direction: true,
          sentAt: true,
        },
      },
    },
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
