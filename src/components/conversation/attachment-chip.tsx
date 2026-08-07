"use client";

import { Download, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export function AttachmentChip({
  id,
  filename,
  size,
  className,
}: {
  id: string;
  filename: string;
  size?: number | null;
  className?: string;
}) {
  const href = `/api/attachments/${id}/download`;
  const sizeLabel =
    size != null
      ? `(${Math.max(1, Math.round(size / 1024))} KB)`
      : null;

  return (
    <a
      href={href}
      download={filename}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "group inline-flex max-w-full items-center gap-[0.375rem] rounded-full border border-black/10 bg-muted/40 px-[0.625rem] py-[0.25rem] text-[0.75rem] font-medium text-muted-foreground transition-colors hover:border-[#0b57d0]/35 hover:bg-[#e8f0fe] hover:text-foreground dark:border-white/10 dark:hover:bg-[#004a77]/30",
        className,
      )}
      title={`Download ${filename}`}
    >
      <Paperclip className="size-[0.875rem] shrink-0" strokeWidth={2.25} />
      <span className="max-w-[12rem] truncate sm:max-w-[16rem]">{filename}</span>
      {sizeLabel ? (
        <span className="shrink-0 text-muted-foreground/80">{sizeLabel}</span>
      ) : null}
      <Download
        className="size-[0.875rem] shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
        strokeWidth={2.25}
        aria-hidden
      />
      <span className="sr-only">Download</span>
    </a>
  );
}
