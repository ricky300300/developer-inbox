import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { sendNewEmail } from "@/lib/conversations/compose";
import { listConversations } from "@/lib/conversations/queries";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;

  const conversations = await listConversations({
    userId: user.id,
    query,
  });

  return NextResponse.json({ conversations });
}

const composeSchema = z.object({
  to: z.string().min(1, "Recipient is required"),
  subject: z.string(),
  from: z.string().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = composeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const conversation = await sendNewEmail({
      userId: user.id,
      to: parsed.data.to,
      subject: parsed.data.subject,
      from: parsed.data.from || undefined,
      html: parsed.data.html,
      text: parsed.data.text,
    });

    return NextResponse.json(
      { conversation: { id: conversation.id } },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send email";
    console.error("Compose error:", error);
    const status =
      message.includes("No active email provider") ||
      message.includes("Invalid")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
