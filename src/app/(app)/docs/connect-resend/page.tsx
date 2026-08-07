import { readFile } from "fs/promises";
import path from "path";
import { MarkdownDoc } from "@/components/docs/markdown-doc";

export const metadata = {
  title: "Connect Resend · Developer Inbox",
};

export default async function ConnectResendDocsPage() {
  const md = await readFile(
    path.join(process.cwd(), "docs/connect-resend.md"),
    "utf8",
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <MarkdownDoc source={md} />
      </div>
    </div>
  );
}
