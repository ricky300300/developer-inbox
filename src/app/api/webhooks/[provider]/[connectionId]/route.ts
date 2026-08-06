import { NextResponse } from "next/server";
import { ingestInboundEmail } from "@/lib/conversations/ingest";
import { toDecryptedConfig } from "@/lib/conversations/reply";
import { prisma } from "@/lib/db";
import { getProvider, isProviderId } from "@/providers/registry";

type Params = {
  params: Promise<{ provider: string; connectionId: string }>;
};

const isDev = process.env.NODE_ENV === "development";

function logWebhook(...args: unknown[]) {
  if (isDev) {
    console.log("[webhook]", ...args);
  }
}

export async function POST(request: Request, { params }: Params) {
  const { provider: providerParam, connectionId } = await params;

  logWebhook("attempt", {
    provider: providerParam,
    connectionId,
    method: request.method,
    contentType: request.headers.get("content-type"),
    svixId: request.headers.get("svix-id"),
    svixTimestamp: request.headers.get("svix-timestamp"),
    hasSignature: Boolean(request.headers.get("svix-signature")),
  });

  try {
    if (!isProviderId(providerParam)) {
      logWebhook("rejected", { reason: "unknown_provider", provider: providerParam });
      return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
    }

    const connection = await prisma.providerConnection.findFirst({
      where: {
        id: connectionId,
        provider: providerParam,
        isActive: true,
      },
    });

    if (!connection) {
      logWebhook("rejected", { reason: "connection_not_found", connectionId });
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const provider = getProvider(providerParam);
    if (!provider.handleWebhook) {
      logWebhook("rejected", { reason: "webhook_unsupported", provider: providerParam });
      return NextResponse.json(
        { error: "Provider does not support webhooks" },
        { status: 400 },
      );
    }

    // Clone so we can log the raw payload without consuming the request body
    if (isDev) {
      try {
        const rawPayload = await request.clone().text();
        let parsed: unknown = rawPayload;
        try {
          parsed = JSON.parse(rawPayload);
        } catch {
          // keep raw string
        }
        logWebhook("raw_event", parsed);
      } catch (error) {
        logWebhook("raw_event_read_failed", error);
      }
    }

    const config = toDecryptedConfig(connection);
    const inbound = await provider.handleWebhook({
      request,
      config,
      webhookSecret: config.webhookSecret,
    });

    if (!inbound) {
      logWebhook("ignored", {
        provider: providerParam,
        connectionId,
        reason: "non_inbound_or_unhandled_event",
      });
      return NextResponse.json({ ok: true, ignored: true });
    }

    logWebhook("inbound_parsed", {
      providerMessageId: inbound.providerMessageId,
      from: inbound.from.email,
      to: inbound.to.map((a) => a.email),
      subject: inbound.subject,
      attachmentCount: inbound.attachments.length,
      receivedAt: inbound.receivedAt.toISOString(),
    });

    const result = await ingestInboundEmail({
      userId: connection.userId,
      connectionId: connection.id,
      inbound,
    });

    logWebhook("ingested", {
      created: result.created,
      conversationId: result.conversation.id,
      messageId: result.message.id,
    });

    return NextResponse.json({
      ok: true,
      created: result.created,
      conversationId: result.conversation.id,
      messageId: result.message.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    if (message === "INVALID_WEBHOOK_SIGNATURE") {
      logWebhook("rejected", { reason: "invalid_signature", connectionId });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.error("[webhook] error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
