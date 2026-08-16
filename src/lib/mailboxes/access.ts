import { prisma } from "@/lib/db";
import { extractEmailAddress } from "@/lib/email/mailbox";
import type { AppRole, Mailbox } from "@/generated/prisma/client";

export type AccessibleMailbox = {
  id: string;
  email: string;
  displayName: string | null;
  connectionId: string;
};

export function normalizeMailboxEmail(raw: string): string {
  return extractEmailAddress(raw, "mailbox").toLowerCase();
}

/**
 * Mailboxes the user can use (switcher, compose allowlist).
 * V1: direct MailboxGrant.userId rows.
 * Later: union with grants for teams the user belongs to (same function).
 */
export async function getAccessibleMailboxes(
  userId: string,
): Promise<AccessibleMailbox[]> {
  const grants = await prisma.mailboxGrant.findMany({
    where: { userId },
    include: {
      mailbox: {
        select: {
          id: true,
          email: true,
          displayName: true,
          connectionId: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const seen = new Set<string>();
  const out: AccessibleMailbox[] = [];
  for (const g of grants) {
    if (seen.has(g.mailbox.id)) continue;
    seen.add(g.mailbox.id);
    out.push({
      id: g.mailbox.id,
      email: g.mailbox.email,
      displayName: g.mailbox.displayName,
      connectionId: g.mailbox.connectionId,
    });
  }
  return out;
}

export async function getAccessibleMailboxIds(userId: string): Promise<string[]> {
  const mailboxes = await getAccessibleMailboxes(userId);
  return mailboxes.map((m) => m.id);
}

export async function canAccessMailbox(
  userId: string,
  mailboxId: string,
): Promise<boolean> {
  const grant = await prisma.mailboxGrant.findFirst({
    where: { userId, mailboxId },
    select: { id: true },
  });
  return Boolean(grant);
}

export async function assertCanAccessMailbox(
  userId: string,
  mailboxId: string,
): Promise<Mailbox> {
  const grant = await prisma.mailboxGrant.findFirst({
    where: { userId, mailboxId },
    include: { mailbox: true },
  });
  if (!grant) {
    throw new Error("FORBIDDEN_MAILBOX");
  }
  return grant.mailbox;
}

export async function assertCanManageMailboxes(
  userId: string,
  connectionId: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new Error("UNAUTHORIZED");

  const connection = await prisma.providerConnection.findFirst({
    where: { id: connectionId },
    select: { userId: true },
  });
  if (!connection) throw new Error("NOT_FOUND");

  if (user.role === "super_admin" || connection.userId === userId) {
    return;
  }
  throw new Error("FORBIDDEN_MANAGE");
}

export function isSuperAdmin(role: AppRole): boolean {
  return role === "super_admin";
}

/** Resolve mailbox for an email on a connection; create if missing (ingest path). */
export async function findMailboxOnConnection(
  connectionId: string,
  email: string,
): Promise<Mailbox | null> {
  const normalized = normalizeMailboxEmail(email);
  return prisma.mailbox.findUnique({
    where: {
      connectionId_email: { connectionId, email: normalized },
    },
  });
}

/**
 * Ensure a mailbox exists for the connection and grant the connection owner access.
 * Used when Settings adds an address or connection is first saved with fromEmail.
 */
export async function ensureMailboxWithOwnerGrant(args: {
  connectionId: string;
  email: string;
  ownerUserId: string;
  displayName?: string | null;
  setPreferredIfEmpty?: boolean;
}): Promise<Mailbox> {
  const email = normalizeMailboxEmail(args.email);

  const mailbox = await prisma.mailbox.upsert({
    where: {
      connectionId_email: {
        connectionId: args.connectionId,
        email,
      },
    },
    create: {
      connectionId: args.connectionId,
      email,
      displayName: args.displayName ?? null,
    },
    update: {
      ...(args.displayName !== undefined
        ? { displayName: args.displayName }
        : {}),
    },
  });

  await prisma.mailboxGrant.upsert({
    where: {
      mailboxId_userId: {
        mailboxId: mailbox.id,
        userId: args.ownerUserId,
      },
    },
    create: {
      mailboxId: mailbox.id,
      userId: args.ownerUserId,
    },
    update: {},
  });

  if (args.setPreferredIfEmpty) {
    await prisma.user.updateMany({
      where: { id: args.ownerUserId, preferredMailboxId: null },
      data: { preferredMailboxId: mailbox.id },
    });
  }

  return mailbox;
}

/**
 * Pick our-side address + mailbox for inbound mail.
 * Prefers receivedFor / to that match a known mailbox on the connection.
 */
export async function resolveInboundOurMailbox(args: {
  connectionId: string;
  candidates: string[];
}): Promise<{ ourAddress: string | null; mailboxId: string | null }> {
  const normalized: string[] = [];
  for (const raw of args.candidates) {
    try {
      normalized.push(normalizeMailboxEmail(raw));
    } catch {
      // skip invalid
    }
  }
  if (normalized.length === 0) {
    return { ourAddress: null, mailboxId: null };
  }

  const mailboxes = await prisma.mailbox.findMany({
    where: {
      connectionId: args.connectionId,
      email: { in: normalized },
    },
  });
  const byEmail = new Map(mailboxes.map((m) => [m.email, m]));

  for (const email of normalized) {
    const match = byEmail.get(email);
    if (match) {
      return { ourAddress: email, mailboxId: match.id };
    }
  }

  return { ourAddress: normalized[0] ?? null, mailboxId: null };
}

export async function resolveOutboundOurMailbox(args: {
  connectionId: string;
  from: string;
}): Promise<{ ourAddress: string; mailboxId: string | null }> {
  const ourAddress = normalizeMailboxEmail(args.from);
  const mailbox = await findMailboxOnConnection(args.connectionId, ourAddress);
  return { ourAddress, mailboxId: mailbox?.id ?? null };
}
