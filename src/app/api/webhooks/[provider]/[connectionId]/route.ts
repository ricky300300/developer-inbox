import { NextResponse } from "next/server";
import { ingestInboundEmail } from "@/lib/conversations/ingest";
import { toDecryptedConfig } from "@/lib/conversations/reply";
import { prisma } from "@/lib/db";
import { getProvider, isProviderId } from "@/providers/registry";

type Params = {
  params: Promise<{ provider: string; connectionId: string }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { provider: providerParam, connectionId } = await params;

    if (!isProviderId(providerParam)) {
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
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const provider = getProvider(providerParam);
    if (!provider.handleWebhook) {
      return NextResponse.json(
        { error: "Provider does not support webhooks" },
        { status: 400 },
      );
    }

    const config = toDecryptedConfig(connection);
    const inbound = await provider.handleWebhook({
      request,
      config,
      webhookSecret: config.webhookSecret,
    });

    if (!inbound) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const result = await ingestInboundEmail({
      userId: connection.userId,
      connectionId: connection.id,
      inbound,
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
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    console.error("Webhook error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
