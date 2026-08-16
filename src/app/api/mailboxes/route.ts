import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { getSessionUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  assertCanManageMailboxes,
  ensureMailboxWithOwnerGrant,
  getAccessibleMailboxes,
} from "@/lib/mailboxes/access";
import { countConversations } from "@/lib/conversations/queries";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("counts") === "1") {
    const mailbox = searchParams.get("mailbox");
    const [inbox, sent] = await Promise.all([
      countConversations({
        userId: user.id,
        folder: "inbox",
        mailboxParam: mailbox,
      }),
      countConversations({
        userId: user.id,
        folder: "sent",
        mailboxParam: mailbox,
      }),
    ]);
    return NextResponse.json({ counts: { inbox, sent } });
  }

  const mailboxes = await getAccessibleMailboxes(user.id);
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { preferredMailboxId: true, role: true },
  });

  return NextResponse.json({
    mailboxes,
    preferredMailboxId: dbUser?.preferredMailboxId ?? null,
    role: dbUser?.role ?? "super_admin",
  });
}

const createSchema = z.object({
  connectionId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().optional(),
});

const preferredSchema = z.object({
  preferredMailboxId: z.string().nullable(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if ("preferredMailboxId" in body && !("email" in body)) {
      const parsed = preferredSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? "Invalid input" },
          { status: 400 },
        );
      }

      const preferredMailboxId = parsed.data.preferredMailboxId;
      if (preferredMailboxId) {
        const accessible = await getAccessibleMailboxes(user.id);
        if (!accessible.some((m) => m.id === preferredMailboxId)) {
          return NextResponse.json(
            { error: "Mailbox not accessible" },
            { status: 403 },
          );
        }
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { preferredMailboxId },
      });

      return NextResponse.json({ ok: true, preferredMailboxId });
    }

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    await assertCanManageMailboxes(user.id, parsed.data.connectionId);

    const mailbox = await ensureMailboxWithOwnerGrant({
      connectionId: parsed.data.connectionId,
      email: parsed.data.email,
      ownerUserId: user.id,
      displayName: parsed.data.displayName ?? null,
      setPreferredIfEmpty: true,
    });

    // Keep config.fromEmail in sync as primary for compose fallback
    const connection = await prisma.providerConnection.findUnique({
      where: { id: parsed.data.connectionId },
    });
    if (connection) {
      const settings =
        connection.config && typeof connection.config === "object"
          ? { ...(connection.config as Record<string, unknown>) }
          : {};
      if (!settings.fromEmail) {
        settings.fromEmail = mailbox.email;
        await prisma.providerConnection.update({
          where: { id: connection.id },
          data: { config: settings as Prisma.InputJsonValue },
        });
      }
    }

    return NextResponse.json(
      {
        mailbox: {
          id: mailbox.id,
          email: mailbox.email,
          displayName: mailbox.displayName,
          connectionId: mailbox.connectionId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "FORBIDDEN_MANAGE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (message.includes("Invalid")) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Mailbox API error:", error);
    return NextResponse.json({ error: "Failed to save mailbox" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing mailbox id" }, { status: 400 });
  }

  try {
    const mailbox = await prisma.mailbox.findUnique({ where: { id } });
    if (!mailbox) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await assertCanManageMailboxes(user.id, mailbox.connectionId);

    const remaining = await prisma.mailbox.count({
      where: { connectionId: mailbox.connectionId },
    });
    if (remaining <= 1) {
      return NextResponse.json(
        { error: "Keep at least one mailbox address on the connection" },
        { status: 400 },
      );
    }

    await prisma.mailbox.delete({ where: { id } });

    // Clear preferred if it pointed here
    await prisma.user.updateMany({
      where: { preferredMailboxId: id },
      data: { preferredMailboxId: null },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    if (message === "FORBIDDEN_MANAGE") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Mailbox delete error:", error);
    return NextResponse.json({ error: "Failed to delete mailbox" }, { status: 500 });
  }
}
