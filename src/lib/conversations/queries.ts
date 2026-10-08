import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getAccessibleMailboxes } from "@/lib/mailboxes/access";

export type ConversationFolder = "inbox" | "sent" | "trash";

export function parseConversationFolder(value?: string | null): ConversationFolder {
  if (value === "sent" || value === "trash") return value;
  return "inbox";
}

export const CONVERSATIONS_PAGE_SIZE = 50;

function mailboxFilterWhere(args: {
  folder: ConversationFolder;
  mailboxIds: string[] | null;
  mailboxEmails: string[] | null;
}): Prisma.ConversationWhereInput {
  // null mailboxIds with empty = no access
  if (args.mailboxIds !== null && args.mailboxIds.length === 0) {
    return { id: "__none__" };
  }

  if (args.mailboxIds === null) {
    if (args.folder === "sent") {
      return { messages: { some: { direction: "outbound" } } };
    }
    return {};
  }

  const mailboxMatch: Prisma.MessageWhereInput = {
    OR: [
      { mailboxId: { in: args.mailboxIds } },
      ...(args.mailboxEmails?.length
        ? [{ ourAddress: { in: args.mailboxEmails } }]
        : []),
    ],
  };

  if (args.folder === "sent") {
    return {
      messages: {
        some: {
          direction: "outbound",
          ...mailboxMatch,
        },
      },
    };
  }

  return {
    messages: {
      some: mailboxMatch,
    },
  };
}

function conversationListWhere(args: {
  userId: string;
  query?: string;
  folder?: ConversationFolder;
  mailboxIds: string[] | null;
  mailboxEmails: string[] | null;
}): Prisma.ConversationWhereInput {
  const q = args.query?.trim();
  const folder = args.folder ?? "inbox";

  return {
    userId: args.userId,
    status: folder === "trash" ? ("trashed" as const) : ("open" as const),
    ...mailboxFilterWhere({
      folder,
      mailboxIds: args.mailboxIds,
      mailboxEmails: args.mailboxEmails,
    }),
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

/**
 * Resolve which mailbox ids to filter by.
 * - mailboxId param: single accessible mailbox
 * - "all": all accessible ids
 * - missing: preferred or first accessible
 */
export async function resolveMailboxFilterIds(args: {
  userId: string;
  mailboxParam?: string | null;
}): Promise<{
  mailboxIds: string[];
  mailboxEmails: string[];
  selectedMailboxId: string | null;
}> {
  const accessible = await getAccessibleMailboxes(args.userId);
  const accessibleIds = accessible.map((m) => m.id);

  if (accessibleIds.length === 0) {
    return { mailboxIds: [], mailboxEmails: [], selectedMailboxId: null };
  }

  const param = args.mailboxParam?.trim();

  if (param === "all") {
    return {
      mailboxIds: accessibleIds,
      mailboxEmails: accessible.map((m) => m.email),
      selectedMailboxId: null,
    };
  }

  if (param) {
    const match = accessible.find(
      (m) => m.id === param || m.email === param.toLowerCase(),
    );
    if (match) {
      return {
        mailboxIds: [match.id],
        mailboxEmails: [match.email],
        selectedMailboxId: match.id,
      };
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: args.userId },
    select: { preferredMailboxId: true },
  });

  if (
    user?.preferredMailboxId &&
    accessibleIds.includes(user.preferredMailboxId)
  ) {
    const pref = accessible.find((m) => m.id === user.preferredMailboxId)!;
    return {
      mailboxIds: [pref.id],
      mailboxEmails: [pref.email],
      selectedMailboxId: pref.id,
    };
  }

  const first = accessible[0]!;
  return {
    mailboxIds: [first.id],
    mailboxEmails: [first.email],
    selectedMailboxId: first.id,
  };
}

export async function listConversations(args: {
  userId: string;
  query?: string;
  folder?: ConversationFolder;
  mailboxParam?: string | null;
  take?: number;
  skip?: number;
}) {
  const {
    userId,
    query,
    folder = "inbox",
    mailboxParam,
    take = CONVERSATIONS_PAGE_SIZE,
    skip = 0,
  } = args;

  const { mailboxIds, mailboxEmails } = await resolveMailboxFilterIds({
    userId,
    mailboxParam,
  });

  return prisma.conversation.findMany({
    where: conversationListWhere({
      userId,
      query,
      folder,
      mailboxIds,
      mailboxEmails,
    }),
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
  mailboxParam?: string | null;
}) {
  const { userId, folder = "inbox", query, mailboxParam } = args;
  const { mailboxIds, mailboxEmails } = await resolveMailboxFilterIds({
    userId,
    mailboxParam,
  });
  return prisma.conversation.count({
    where: conversationListWhere({
      userId,
      query,
      folder,
      mailboxIds,
      mailboxEmails,
    }),
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
