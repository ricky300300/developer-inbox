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
  Paperclip,
  RemoveFormatting,
  Reply,
  ReplyAll,
  Strikethrough,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { composeEmailBodies } from "@/lib/email/compose-html";
import {
  fileToComposerAttachment,
  formatAttachmentSize,
  type ComposerAttachment,
} from "@/lib/email/attachments-client";
import { formatMailbox } from "@/lib/email/display";

type ToolbarAction =
  | "bold"
  | "italic"
  | "underline"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "removeFormat";

export type EmailComposerHandle = {
  getBodies: () => {
    html: string;
    text: string;
    isEmpty: boolean;
    attachments: ComposerAttachment[];
  };
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
        "inline-flex size-[2rem] items-center justify-center rounded-[0.375rem] text-foreground/75 transition-colors hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10",
        active && "bg-black/10 text-foreground dark:bg-white/15",
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
  onSend?: (body: {
    html: string;
    text: string;
    attachments: ComposerAttachment[];
  }) => Promise<void>;
  title?: string;
  placeholder?: string;
  showMeta?: boolean;
  showSendButton?: boolean;
  asForm?: boolean;
  /** Grow the editor to fill remaining vertical space in a flex parent. */
  fillHeight?: boolean;
  /** Compact reply/compose chrome: recipient header, bottom toolbar, discard. */
  variant?: "default" | "mail-reply" | "mail-compose";
  replyKind?: "reply" | "replyAll";
  onDiscard?: () => void;
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
      fillHeight = false,
      variant = "default",
      replyKind = "reply",
      onDiscard,
      className,
      editorClassName,
      onEmptyChange,
      onRequestSend,
    },
    ref,
  ) {
    const isMailReply = variant === "mail-reply";
    const isMailCompose = variant === "mail-compose";
    const isMailChrome = isMailReply || isMailCompose;
    const editorRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [sending, setSending] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);
    const [active, setActive] = useState<Record<string, boolean>>({});
    const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
    const [formatOpen, setFormatOpen] = useState(false);

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
            return { html: "", text: "", isEmpty: true, attachments };
          }
          return {
            ...composeEmailBodies(editorRef.current.innerHTML),
            attachments,
          };
        },
        clear: () => {
          if (editorRef.current) editorRef.current.innerHTML = "";
          setIsEmpty(true);
          setActive({});
          setAttachments([]);
          onEmptyChange?.(true);
        },
        focus: () => editorRef.current?.focus(),
      }),
      [onEmptyChange, attachments],
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
      setAttachments([]);
      onEmptyChange?.(true);
    }

    async function addFiles(files: FileList | null) {
      if (!files?.length) return;
      try {
        const next: ComposerAttachment[] = [];
        for (const file of Array.from(files)) {
          next.push(await fileToComposerAttachment(file));
        }
        setAttachments((prev) => [...prev, ...next].slice(0, 10));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to attach file",
        );
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
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
        await onSend({
          html: composed.html,
          text: composed.text,
          attachments,
        });
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

    const formatToolbar = (
      <div
        className={cn(
          "flex flex-wrap items-center gap-[0.125rem] px-[0.5rem] py-[0.375rem]",
          isMailChrome
            ? "rounded-full bg-[#e8eaed] shadow-sm dark:bg-zinc-700/90"
            : "border-b border-black/10 bg-[#e8eaed] dark:border-white/10 dark:bg-zinc-700/80",
        )}
      >
        <ToolbarButton
          label="Bold"
          active={active.bold}
          onClick={() => run("bold")}
        >
          <Bold className="size-[1rem]" strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={active.italic}
          onClick={() => run("italic")}
        >
          <Italic className="size-[1rem]" strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={active.underline}
          onClick={() => run("underline")}
        >
          <Underline className="size-[1rem]" strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={active.strikeThrough}
          onClick={() => run("strikeThrough")}
        >
          <Strikethrough className="size-[1rem]" strokeWidth={2.5} />
        </ToolbarButton>
        <div className="mx-[0.25rem] h-[1.25rem] w-px bg-black/15 dark:bg-white/20" />
        <ToolbarButton label="Insert link" onClick={insertLink}>
          <LinkIcon className="size-[1rem]" strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          label="Bullet list"
          active={active.insertUnorderedList}
          onClick={() => run("insertUnorderedList")}
        >
          <List className="size-[1rem]" strokeWidth={2.5} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={active.insertOrderedList}
          onClick={() => run("insertOrderedList")}
        >
          <ListOrdered className="size-[1rem]" strokeWidth={2.5} />
        </ToolbarButton>
        <div className="mx-[0.25rem] h-[1.25rem] w-px bg-black/15 dark:bg-white/20" />
        <ToolbarButton
          label="Clear formatting"
          onClick={() => run("removeFormat")}
        >
          <RemoveFormatting className="size-[1rem]" strokeWidth={2.5} />
        </ToolbarButton>
      </div>
    );

    const editor = (
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
          "email-composer w-full cursor-text overflow-y-auto px-[1rem] py-[0.75rem] text-[0.9375rem] leading-[1.65] font-medium text-foreground outline-none",
          "[&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline",
          "[&_ul]:my-[0.5em] [&_ul]:list-disc [&_ul]:pl-[1.5em]",
          "[&_ol]:my-[0.5em] [&_ol]:list-decimal [&_ol]:pl-[1.5em]",
          "[&_p]:my-0",
          fillHeight || isMailChrome ? "min-h-0 flex-1" : "min-h-[9rem] max-h-[18rem]",
          isEmpty && "is-empty",
          editorClassName,
        )}
      />
    );

    const attachmentList =
      attachments.length > 0 ? (
        <div className="flex flex-wrap gap-[0.375rem] px-[1rem] pb-[0.5rem]">
          {attachments.map((a) => (
            <span
              key={a.id}
              className="inline-flex max-w-full items-center gap-[0.35rem] rounded-full bg-muted px-[0.625rem] py-[0.2rem] text-[0.75rem] text-foreground"
            >
              <Paperclip className="size-[0.75rem] shrink-0" strokeWidth={2.25} />
              <span className="max-w-[10rem] truncate">{a.filename}</span>
              <span className="shrink-0 text-muted-foreground">
                {formatAttachmentSize(a.size)}
              </span>
              <button
                type="button"
                aria-label={`Remove ${a.filename}`}
                className="inline-flex size-[1.1rem] items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                onClick={() =>
                  setAttachments((prev) => prev.filter((x) => x.id !== a.id))
                }
              >
                <X className="size-[0.75rem]" strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      ) : null;

    const fileInput = (
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => void addFiles(e.target.files)}
      />
    );

    const mailActionBar = (
      <div className="shrink-0 px-[0.75rem] pt-[0.35rem] pb-[0.75rem]">
        {formatOpen ? (
          <div className="mb-[0.5rem]">{formatToolbar}</div>
        ) : null}
        <div className="flex items-center gap-[0.25rem]">
          <Button
            type={asForm ? "submit" : "button"}
            className="rounded-full bg-[#0b57d0] px-[1.5rem] font-medium text-white hover:bg-[#0b57d0]/90 dark:bg-[#a8c7fa] dark:text-[#062e6f] dark:hover:bg-[#a8c7fa]/90"
            disabled={sending || disabled || isEmpty}
            onClick={asForm ? undefined : () => void handleSubmit()}
          >
            {sending ? "Sending…" : "Send"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "size-[2.25rem] rounded-full text-[0.8125rem] font-semibold tracking-tight text-foreground/70",
              formatOpen &&
                "bg-[#d3e3fd] text-[#041e49] hover:bg-[#d3e3fd] dark:bg-[#004a77]/50 dark:text-[#c2e7ff]",
            )}
            aria-label="Formatting options"
            aria-pressed={formatOpen}
            disabled={sending || disabled}
            onClick={() => setFormatOpen((v) => !v)}
          >
            Aa
          </Button>
          {fileInput}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-[2.25rem] text-foreground/70"
            aria-label="Attach files"
            disabled={sending || disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="size-[1rem]" strokeWidth={2.25} />
          </Button>
          <div className="flex-1" />
          {onDiscard ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-[2.25rem] text-foreground/70"
              aria-label="Discard"
              disabled={sending}
              onClick={onDiscard}
            >
              <Trash2 className="size-[1rem]" strokeWidth={2.25} />
            </Button>
          ) : null}
        </div>
      </div>
    );

    const body = isMailChrome ? (
      <>
        {isMailReply ? (
          <div className="flex shrink-0 items-center gap-[0.5rem] border-b border-black/10 px-[1rem] py-[0.625rem] dark:border-white/10">
            {replyKind === "replyAll" ? (
              <ReplyAll
                className="size-[1rem] shrink-0 text-foreground/70"
                strokeWidth={2.25}
              />
            ) : (
              <Reply
                className="size-[1rem] shrink-0 text-foreground/70"
                strokeWidth={2.25}
              />
            )}
            <span className="truncate text-[0.875rem] font-medium text-foreground">
              {to ? formatMailbox(to) : "Recipient"}
            </span>
          </div>
        ) : null}
        {editor}
        {attachmentList}
        {mailActionBar}
      </>
    ) : (
      <>
        {title || showMeta ? (
          <div className="shrink-0">
            {title ? (
              <p className="mb-[0.75rem] text-[0.875rem] font-semibold">
                {title}
              </p>
            ) : null}
            {showMeta ? (
              <div className="mb-[0.75rem] grid grid-cols-[3.5rem_1fr] gap-x-[0.75rem] gap-y-[0.25rem] text-[0.875rem]">
                {from ? (
                  <>
                    <span className="font-medium text-muted-foreground">
                      From
                    </span>
                    <span className="truncate font-medium text-foreground/90">
                      {formatMailbox(from)}
                    </span>
                  </>
                ) : null}
                {to ? (
                  <>
                    <span className="font-medium text-muted-foreground">To</span>
                    <span className="truncate font-medium text-foreground/90">
                      {to
                        .split(",")
                        .map((part) => formatMailbox(part.trim()))
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            "flex min-h-0 flex-col overflow-hidden bg-background",
            fillHeight
              ? "flex-1 border-0"
              : "rounded-[0.5rem] border border-black/10 dark:border-white/10",
          )}
        >
          {formatToolbar}
          {editor}
          {attachmentList}
        </div>

        {showSendButton ? (
          <div className="mt-[0.75rem] flex shrink-0 items-center gap-[0.5rem]">
            <Button
              type={asForm ? "submit" : "button"}
              className="rounded-full bg-[#0b57d0] px-[1.25rem] font-medium text-white hover:bg-[#0b57d0]/90 dark:bg-[#a8c7fa] dark:text-[#062e6f] dark:hover:bg-[#a8c7fa]/90"
              disabled={sending || disabled || isEmpty}
              onClick={asForm ? undefined : () => void handleSubmit()}
            >
              {sending ? "Sending…" : "Send"}
            </Button>
            {fileInput}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-[2.25rem] text-foreground/70"
              aria-label="Attach files"
              disabled={sending || disabled}
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-[1rem]" strokeWidth={2.25} />
            </Button>
            <p className="hidden text-[0.75rem] font-medium text-muted-foreground sm:block">
              ⌘/Ctrl + Enter to send · Formatted for Gmail, Outlook, Apple Mail
            </p>
          </div>
        ) : null}
      </>
    );

    if (asForm) {
      return (
        <form
          onSubmit={handleSubmit}
          className={cn(
            "flex flex-col bg-transparent",
            isMailChrome
              ? "h-full min-h-0 p-0"
              : fillHeight
                ? "h-full min-h-0 px-4 py-4 sm:px-5"
                : "shrink-0 px-4 py-4 sm:px-5",
            className,
          )}
        >
          {body}
        </form>
      );
    }

    return (
      <div
        className={cn(
          "flex flex-col",
          fillHeight || isMailChrome ? "h-full min-h-0" : null,
          className,
        )}
      >
        {body}
      </div>
    );
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
