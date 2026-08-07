import ReactMarkdown from "react-markdown";

export function MarkdownDoc({ source }: { source: string }) {
  return (
    <article className="space-y-4 text-sm leading-relaxed text-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-medium [&_hr]:my-8 [&_hr]:border-border [&_li]:ml-4 [&_li]:list-disc [&_ol>li]:list-decimal [&_p]:text-muted-foreground [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border/60 [&_pre]:bg-muted/30 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:space-y-1">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            const isExternal = href?.startsWith("http");
            const resolved =
              href === "../README.md"
                ? "/"
                : href?.endsWith("connect-resend.md")
                  ? "/docs/connect-resend"
                  : href;
            return (
              <a
                href={resolved}
                {...(isExternal
                  ? { target: "_blank", rel: "noreferrer" }
                  : {})}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </article>
  );
}
