/**
 * Convert editor HTML into multipart-friendly email bodies.
 * Output uses conservative tags + inline styles for Gmail, Outlook,
 * Apple Mail, Yahoo, and mobile clients.
 */

const BLOCK_TAGS = new Set(["P", "DIV", "H1", "H2", "H3", "LI", "BLOCKQUOTE"]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed) return null;
  if (/^(https?:|mailto:)/i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
  if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function plainTextFromNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName;

  if (tag === "BR") return "\n";

  const parts = Array.from(el.childNodes).map(plainTextFromNode).join("");

  if (tag === "LI") return `• ${parts.trim()}\n`;
  if (BLOCK_TAGS.has(tag) || tag === "UL" || tag === "OL") {
    return `${parts.replace(/\n+$/, "")}\n\n`;
  }
  return parts;
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? "");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName;
  const inner = Array.from(el.childNodes).map(serializeInline).join("");

  if (tag === "BR") return "<br>";
  if (tag === "STRONG" || tag === "B") {
    return `<strong style="font-weight:bold;">${inner}</strong>`;
  }
  if (tag === "EM" || tag === "I") {
    return `<em style="font-style:italic;">${inner}</em>`;
  }
  if (tag === "U") {
    return `<u style="text-decoration:underline;">${inner}</u>`;
  }
  if (tag === "S" || tag === "STRIKE" || tag === "DEL") {
    return `<span style="text-decoration:line-through;">${inner}</span>`;
  }
  if (tag === "A") {
    const href = normalizeHref(el.getAttribute("href") ?? "");
    if (!href) return inner;
    return `<a href="${escapeHtml(href)}" style="color:#1155cc;text-decoration:underline;" target="_blank" rel="noopener noreferrer">${inner || escapeHtml(href)}</a>`;
  }
  if (tag === "SPAN") return inner;

  return inner;
}

function serializeBlock(el: HTMLElement): string {
  const tag = el.tagName;
  const style =
    "margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222222;";

  if (tag === "UL") {
    const items = Array.from(el.children)
      .filter((c) => c.tagName === "LI")
      .map(
        (li) =>
          `<li style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222222;">${Array.from(li.childNodes).map(serializeInline).join("")}</li>`,
      )
      .join("");
    return `<ul style="margin:0 0 12px 0;padding-left:24px;">${items}</ul>`;
  }

  if (tag === "OL") {
    const items = Array.from(el.children)
      .filter((c) => c.tagName === "LI")
      .map(
        (li) =>
          `<li style="margin:0 0 6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222222;">${Array.from(li.childNodes).map(serializeInline).join("")}</li>`,
      )
      .join("");
    return `<ol style="margin:0 0 12px 0;padding-left:24px;">${items}</ol>`;
  }

  if (tag === "BLOCKQUOTE") {
    const inner = Array.from(el.childNodes)
      .map((child) =>
        child.nodeType === Node.ELEMENT_NODE &&
        BLOCK_TAGS.has((child as HTMLElement).tagName)
          ? serializeBlock(child as HTMLElement)
          : serializeInline(child),
      )
      .join("");
    return `<blockquote style="margin:0 0 12px 0;padding-left:12px;border-left:3px solid #cccccc;color:#555555;">${inner}</blockquote>`;
  }

  if (tag === "H1" || tag === "H2" || tag === "H3") {
    const size = tag === "H1" ? "20px" : tag === "H2" ? "18px" : "16px";
    return `<p style="${style}font-size:${size};font-weight:bold;">${Array.from(el.childNodes).map(serializeInline).join("")}</p>`;
  }

  const inner = Array.from(el.childNodes).map(serializeInline).join("");
  if (!inner.replace(/<br\s*\/?>/gi, "").trim()) {
    return `<p style="${style}">&nbsp;</p>`;
  }
  return `<p style="${style}">${inner}</p>`;
}

function wrapEmailDocument(body: string): string {
  return [
    `<!DOCTYPE html>`,
    `<html>`,
    `<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" /></head>`,
    `<body style="margin:0;padding:0;background-color:#ffffff;">`,
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background-color:#ffffff;">`,
    `<tr><td style="padding:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222222;">`,
    body,
    `</td></tr></table>`,
    `</body></html>`,
  ].join("");
}

export type ComposedEmailBody = {
  html: string;
  text: string;
  isEmpty: boolean;
};

/** Browser-side: parse editor HTML into email-safe html + plain text. */
export function composeEmailBodies(editorHtml: string): ComposedEmailBody {
  if (typeof window === "undefined") {
    const text = editorHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return {
      html: text ? wrapEmailDocument(`<p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#222222;">${escapeHtml(text)}</p>`) : "",
      text,
      isEmpty: !text,
    };
  }

  const template = document.createElement("template");
  template.innerHTML = editorHtml.trim();
  const root = template.content;

  const blocks: string[] = [];
  const children = Array.from(root.childNodes);

  if (children.length === 0) {
    return { html: "", text: "", isEmpty: true };
  }

  let inlineBuffer: Node[] = [];

  const flushInline = () => {
    if (inlineBuffer.length === 0) return;
    const wrapper = document.createElement("p");
    for (const n of inlineBuffer) wrapper.appendChild(n.cloneNode(true));
    blocks.push(serializeBlock(wrapper));
    inlineBuffer = [];
  };

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      if (
        BLOCK_TAGS.has(el.tagName) ||
        el.tagName === "UL" ||
        el.tagName === "OL"
      ) {
        flushInline();
        blocks.push(serializeBlock(el));
        continue;
      }
    }
    if (
      child.nodeType === Node.TEXT_NODE &&
      !(child.textContent ?? "").trim()
    ) {
      continue;
    }
    inlineBuffer.push(child);
  }
  flushInline();

  const text = plainTextFromNode(root)
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const htmlBody = blocks.join("");
  const isEmpty = !text && !htmlBody.replace(/&nbsp;|<[^>]+>/g, "").trim();

  return {
    html: isEmpty ? "" : wrapEmailDocument(htmlBody),
    text,
    isEmpty,
  };
}
