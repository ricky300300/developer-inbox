export type ComposerAttachment = {
  id: string;
  filename: string;
  contentType?: string;
  size: number;
  content: string;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function fileToComposerAttachment(
  file: File,
): Promise<ComposerAttachment> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`“${file.name}” is larger than 10 MB`);
  }

  const content = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1]! : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

  return {
    id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
    filename: file.name,
    contentType: file.type || undefined,
    size: file.size,
    content,
  };
}

export function formatAttachmentSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
