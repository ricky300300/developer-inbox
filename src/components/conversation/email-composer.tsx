"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  List,
  ListOrdered,
  RemoveFormatting,
  Strikethrough,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { composeEmailBodies } from "@/lib/email/compose-html";

type ToolbarAction =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "removeFormat";

export type EmailComposerHandle = {
  getBodies: () => { html: string; text: string; isEmpty: boolean };
  clear: () => void;
  focus: () => void;
};

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

type EmailComposerProps = {
  from?: string;
  to?: string;
  disabled?: boolean;
  onSend?: (body: { html: string; text: string }) => Promise<void>;
  title?: string;
  placeholder?: string;
  showMeta?: boolean;
  showSendButton?: boolean;
  asForm?: boolean;
  className?: string;
  editorClassName?: string;
  onEmptyChange?: (isEmpty: boolean) => void;
  onRequestSend?: () => void;
};

export const EmailComposer = forwardRef<EmailComposerHandle, EmailComposerProps>(
  function EmailComposer(
    {
      from,
      to,
      disabled,
      onSend,
      title = "Reply",
      placeholder = "Write your reply…",
      showMeta = true,
      showSendButton = true,
      asForm = true,
      className,
      editorClassName,
      onEmptyChange,
      onRequestSend,
    },
    ref,
  ) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [active, setActive] = useState<Record<string, boolean>>({});

    const syncToolbar = useCallback(() => {
      if (typeof document === "undefined") return;
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
      });
    }, []);

    const syncEmpty = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const text = el.innerText.replace(/\u00a0/g, " ").trim();
      const next = !text;
      setIsEmpty(next);
      onEmptyChange?.(next);
    }, [onEmptyChange]);

    useImperativeHandle(
      ref,
      () => ({
        getBodies: () => {
          if (!editorRef.current) {
            return { html: "", text: "", isEmpty: true };
          }
          return composeEmailBodies(editorRef.current.innerHTML);
        },
        clear: () => {
          if (editorRef.current) editorRef.current.innerHTML = "";
          setIsEmpty(true);
          setActive({});
          onEmptyChange?.(true);
        },
        focus: () => editorRef.current?.focus(),
      }),
      [onEmptyChange],
    );

    useEffect(() => {
      const onSelectionChange = () => {
        const el = editorRef.current;
        if (!el) return;
        const sel = document.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        if (el.contains(sel.anchorNode)) syncToolbar();
      };
      document.addEventListener("selectionchange", onSelectionChange);
      return () =>
        document.removeEventListener("selectionchange", onSelectionChange);
    }, [syncToolbar]);

    function focusEditor() {
      editorRef.current?.focus();
    }

    function run(command: ToolbarAction) {
      focusEditor();
      document.execCommand(command, false);
      syncToolbar();
      syncEmpty();
    }

    function insertLink() {
      focusEditor();
      const existing = document.queryCommandValue("createLink");
      const input = window.prompt("Link URL", existing || "https://");
      if (!input) return;
      const href = input.trim();
      if (!href) return;
      document.execCommand("createLink", false, href);
      syncToolbar();
    }

    function clearEditor() {
      if (editorRef.current) editorRef.current.innerHTML = "";
      setIsEmpty(true);
      setActive({});
      onEmptyChange?.(true);
    }

    async function handleSubmit(e?: FormEvent) {
      e?.preventDefault();
      if (onRequestSend) {
        onRequestSend();
        return;
      }
      if (!editorRef.current || sending || disabled || !onSend) return;

      const composed = composeEmailBodies(editorRef.current.innerHTML);
      if (composed.isEmpty) return;

      setSending(true);
      try {
        await onSend({ html: composed.html, text: composed.text });
        clearEditor();
      } finally {
        setSending(false);
      }
    }

    function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void handleSubmit();
      }
    }

    function onPaste(e: ClipboardEvent<HTMLDivElement>) {
      e.preventDefault();
      const html = e.clipboardData.getData("text/html");
      const text = e.clipboardData.getData("text/plain");

      if (html) {
        document.execCommand("insertHTML", false, sanitizePasteHtml(html));
      } else if (text) {
        document.execCommand("insertText", false, text);
      }
      syncEmpty();
      syncToolbar();
    }

    const body = (
      <>
        {title ? <p className="mb-3 text-sm font-medium">{title}</p> : null}
        {showMeta ? (
          <div className="mb-3 grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-1 text-sm">
            {from ? (
              <>
                <span className="text-muted-foreground">From</span>
                <span className="truncate text-foreground/90">{from}</span>
              </>
            ) : null}
            {to ? (
              <>
                <span className="text-muted-foreground">To</span>
                <span className="truncate text-foreground/90">{to}</span>
              </>
            ) : null}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-lg border border-border/70 bg-background">
          <div className="flex flex-wrap items-center gap-0.5 border-b border-border/60 bg-muted/20 px-2 py-1.5">
            <ToolbarButton
              label="Bold"
              active={active.bold}
              onClick={() => run("bold")}
            >
              <Bold className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label="Italic"
              active={active.italic}
              onClick={() => run("italic")}
            >
              <Italic className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label="Underline"
              active={active.underline}
              onClick={() => run("underline")}
            >
              <Underline className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label="Strikethrough"
              active={active.strikeThrough}
              onClick={() => run("strikeThrough")}
            >
              <Strikethrough className="size-4" />
            </ToolbarButton>
            <div className="mx-1 h-5 w-px bg-border/70" />
            <ToolbarButton label="Insert link" onClick={insertLink}>
              <LinkIcon className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label="Bullet list"
              active={active.insertUnorderedList}
              onClick={() => run("insertUnorderedList")}
            >
              <List className="size-4" />
            </ToolbarButton>
            <ToolbarButton
              label="Numbered list"
              active={active.insertOrderedList}
              onClick={() => run("insertOrderedList")}
            >
              <ListOrdered className="size-4" />
            </ToolbarButton>
            <div className="mx-1 h-5 w-px bg-border/70" />
            <ToolbarButton
              label="Clear formatting"
              onClick={() => run("removeFormat")}
            >
              <RemoveFormatting className="size-4" />
            </ToolbarButton>
          </div>

          <div
            ref={editorRef}
            role="textbox"
            aria-multiline="true"
            aria-label={title || "Email body"}
            contentEditable={!disabled && !sending}
            suppressContentEditableWarning
            onInput={() => {
              syncEmpty();
              syncToolbar();
            }}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            data-placeholder={placeholder}
            className={cn(
              "email-composer min-h-36 max-h-72 overflow-y-auto px-4 py-3 text-[15px] leading-7 text-foreground outline-none",
              "[&_a]:text-blue-600 [&_a]:underline",
              "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6",
              "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6",
              "[&_p]:my-0",
              isEmpty && "is-empty",
              editorClassName,
            )}
          />
        </div>

        {showSendButton ? (
          <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="hidden text-xs text-muted-foreground sm:block">
              ⌘/Ctrl + Enter to send · Formatted for Gmail, Outlook, Apple Mail
            </p>
            <Button
              type={asForm ? "submit" : "button"}
              className="w-full sm:w-auto"
              disabled={sending || disabled || isEmpty}
              onClick={asForm ? undefined : () => void handleSubmit()}
            >
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        ) : null}
      </>
    );

    if (asForm) {
      return (
        <form
          onSubmit={handleSubmit}
          className={cn(
            "shrink-0 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur sm:px-6",
            className,
          )}
        >
          {body}
        </form>
      );
    }

    return <div className={cn(className)}>{body}</div>;
  },
);

function sanitizePasteHtml(html: string): string {
  const template = document.createElement("template");
  template.innerHTML = html;

  const walker = document.createTreeWalker(
    template.content,
    NodeFilter.SHOW_ELEMENT,
  );
  const toUnwrap: Element[] = [];

  while (walker.nextNode()) {
    const el = walker.currentNode as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const allowed = new Set([
      "b",
      "strong",
      "i",
      "em",
      "u",
      "s",
      "strike",
      "a",
      "ul",
      "ol",
      "li",
      "p",
      "div",
      "br",
      "span",
      "blockquote",
    ]);

    if (!allowed.has(tag)) {
      toUnwrap.push(el);
      continue;
    }

    el.removeAttribute("style");
    el.removeAttribute("class");
    el.removeAttribute("id");

    if (tag === "a") {
      const href = el.getAttribute("href");
      [...el.attributes].forEach((attr) => {
        if (attr.name !== "href") el.removeAttribute(attr.name);
      });
      if (href) el.setAttribute("href", href);
    }
  }

  for (const el of toUnwrap) {
    const parent = el.parentNode;
    if (!parent) continue;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  }

  return template.innerHTML;
}
