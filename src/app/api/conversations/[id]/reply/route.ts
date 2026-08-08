import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { sendConversationReply } from "@/lib/conversations/reply";

const replySchema = z.object({
  to: z.string().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string().min(1),
        contentType: z.string().optional(),
        content: z.string().min(1),
        size: z.number().int().nonnegative().optional(),
      }),
    )
    .optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid reply payload" }, { status: 400 });
    }

    const message = await sendConversationReply({
      userId: user.id,
      conversationId: id,
      to: parsed.data.to,
      html: parsed.data.html,
      text: parsed.data.text,
      attachments: parsed.data.attachments,
    });

    return NextResponse.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send reply";
    if (message === "NOT_FOUND") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    console.error("Reply error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
