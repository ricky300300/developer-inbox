import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { resolveAttachmentDownload } from "@/lib/attachments/download";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const file = await resolveAttachmentDownload({
      userId: user.id,
      attachmentId: id,
    });

    if (!file) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const disposition = `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`;

    return new NextResponse(new Uint8Array(file.body), {
      status: 200,
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(file.body.length),
        "Content-Disposition": disposition,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to download attachment";
    console.error("Attachment download error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
