import { prisma } from "@/lib/db";

export async function trashConversations(args: {
  userId: string;
  ids: string[];
}) {
  if (args.ids.length === 0) return 0;
  const result = await prisma.conversation.updateMany({
    where: {
      userId: args.userId,
      id: { in: args.ids },
      status: "open",
    },
    data: { status: "trashed" },
  });
  return result.count;
}

export async function restoreConversations(args: {
  userId: string;
  ids: string[];
}) {
  if (args.ids.length === 0) return 0;
  const result = await prisma.conversation.updateMany({
    where: {
      userId: args.userId,
      id: { in: args.ids },
      status: "trashed",
    },
    data: { status: "open" },
  });
  return result.count;
}
