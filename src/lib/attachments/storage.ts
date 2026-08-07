import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { OutboundAttachment } from "@/providers/types";

const ROOT = path.join(process.cwd(), ".data", "attachments");

export function localAttachmentPath(attachmentId: string) {
  return path.join(ROOT, attachmentId);
}

export async function persistOutboundAttachmentFiles(
  records: Array<{ id: string; filename: string }>,
  payloads: OutboundAttachment[],
) {
  if (records.length === 0 || payloads.length === 0) return;
  await mkdir(ROOT, { recursive: true });

  const byName = new Map(payloads.map((p) => [p.filename, p]));
  for (const record of records) {
    const payload =
      byName.get(record.filename) ??
      payloads.find((p) => p.filename === record.filename);
    if (!payload?.content) continue;
    await writeFile(
      localAttachmentPath(record.id),
      Buffer.from(payload.content, "base64"),
    );
  }
}

export async function readLocalAttachment(
  attachmentId: string,
): Promise<Buffer | null> {
  try {
    return await readFile(localAttachmentPath(attachmentId));
  } catch {
    return null;
  }
}
