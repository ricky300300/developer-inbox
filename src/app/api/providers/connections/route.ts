import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { encryptSecret } from "@/lib/crypto/secrets";
import { prisma } from "@/lib/db";
import { getProvider, isProviderId } from "@/providers/registry";
import type { ProviderId } from "@/providers/types";

const upsertSchema = z.object({
  provider: z.string(),
  apiKey: z.string().optional(),
  webhookSecret: z.string().optional(),
  fromEmail: z.string().email(),
  connectionId: z.string().optional(),
});

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.providerConnection.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

  return NextResponse.json({
    connections: connections.map((c) => {
      const settings =
        c.config && typeof c.config === "object"
          ? (c.config as Record<string, unknown>)
          : {};
      return {
        id: c.id,
        provider: c.provider,
        isActive: c.isActive,
        fromEmail: typeof settings.fromEmail === "string" ? settings.fromEmail : "",
        hasApiKey: Boolean(c.apiKeyEncrypted),
        hasWebhookSecret: Boolean(c.webhookSecretEncrypted),
        webhookUrl: appUrl
          ? `${appUrl}/api/webhooks/${c.provider}/${c.id}`
          : `/api/webhooks/${c.provider}/${c.id}`,
        createdAt: c.createdAt,
      };
    }),
  });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { provider, apiKey, webhookSecret, fromEmail, connectionId } =
      parsed.data;

    if (!isProviderId(provider)) {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    const adapter = getProvider(provider);
    const config = { fromEmail };

    if (connectionId) {
      const existing = await prisma.providerConnection.findFirst({
        where: { id: connectionId, userId: user.id },
      });
      if (!existing) {
        return NextResponse.json({ error: "Connection not found" }, { status: 404 });
      }

      const updated = await prisma.providerConnection.update({
        where: { id: connectionId },
        data: {
          ...(apiKey?.trim()
            ? { apiKeyEncrypted: encryptSecret(apiKey.trim()) }
            : {}),
          ...(webhookSecret?.trim()
            ? { webhookSecretEncrypted: encryptSecret(webhookSecret.trim()) }
            : {}),
          config,
          isActive: true,
        },
      });

      return NextResponse.json({ connection: { id: updated.id } });
    }

    if (!apiKey?.trim()) {
      return NextResponse.json({ error: "API key is required" }, { status: 400 });
    }

    if (adapter.receiveMode === "webhook" && !webhookSecret?.trim()) {
      return NextResponse.json(
        { error: "Webhook signing secret is required" },
        { status: 400 },
      );
    }

    const created = await prisma.providerConnection.create({
      data: {
        userId: user.id,
        provider: provider as ProviderId,
        apiKeyEncrypted: encryptSecret(apiKey.trim()),
        webhookSecretEncrypted: webhookSecret?.trim()
          ? encryptSecret(webhookSecret.trim())
          : null,
        config,
        isActive: true,
      },
    });

    return NextResponse.json({ connection: { id: created.id } }, { status: 201 });
  } catch (error) {
    console.error("Provider connection error:", error);
    return NextResponse.json(
      { error: "Failed to save provider connection" },
      { status: 500 },
    );
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
    return NextResponse.json({ error: "Missing connection id" }, { status: 400 });
  }

  const existing = await prisma.providerConnection.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.providerConnection.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
