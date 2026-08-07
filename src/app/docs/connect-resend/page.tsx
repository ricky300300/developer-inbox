import Link from "next/link";
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="truncate text-sm font-medium text-foreground hover:opacity-80"
          >
            Developer Inbox
          </Link>
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <Link
              href="/settings"
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Settings
            </Link>
            <Link
              href="/inbox"
              className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Inbox
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <MarkdownDoc source={md} />
      </main>
    </div>
  );
}
