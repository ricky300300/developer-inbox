import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function headingText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(headingText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return headingText(
      (children as { props: { children?: React.ReactNode } }).props.children,
    );
  }
  return "";
}

export function MarkdownDoc({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  return (
    <article className={cn("m-prose", className)}>
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
          h1: ({ children }) => {
            const text = headingText(children);
            return <h1 id={slugify(text)}>{children}</h1>;
          },
          h2: ({ children }) => {
            const text = headingText(children);
            return <h2 id={slugify(text)}>{children}</h2>;
          },
          h3: ({ children }) => {
            const text = headingText(children);
            return <h3 id={slugify(text)}>{children}</h3>;
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </article>
  );
}
