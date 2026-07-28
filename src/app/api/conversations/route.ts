import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
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
