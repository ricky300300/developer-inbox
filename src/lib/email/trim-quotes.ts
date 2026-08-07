/**
 * Split an email body into the new reply content and older quoted thread.
 * Detects common client quote wrappers and “On … wrote:” markers.
 */

function isVisuallyEmptyHtml(html: string): boolean {
  return !html
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, "")
    .trim();
}

function serializeChildren(nodes: Node[]): string {
  return nodes
    .map((n) => {
      if (n.nodeType === Node.ELEMENT_NODE) {
        return (n as Element).outerHTML;
      }
      return n.textContent ?? "";
    })
    .join("");
}

function findQuoteElement(root: HTMLElement): Element | null {
  const byClass = root.querySelector(
    ".gmail_quote_container, .gmail_quote, .yahoo_quoted, #divRplyFwdMsg, .OutlookMessageHeader",
  );
  if (byClass) return byClass;

  for (const el of Array.from(root.querySelectorAll(".gmail_attr"))) {
    const parent = el.parentElement;
    if (
      parent &&
      parent !== root &&
      (parent.classList.contains("gmail_quote") ||
        parent.classList.contains("gmail_quote_container"))
    ) {
      return parent;
    }
    return el;
  }

  for (const el of Array.from(root.querySelectorAll("blockquote"))) {
    const text = (el.textContent ?? "").trim();
    const prev = el.previousElementSibling;
    const prevText = (prev?.textContent ?? "").trim();
    if (
      /^on\s.+wrote:/i.test(text) ||
      /^on\s.+wrote:/i.test(prevText) ||
      el.classList.contains("gmail_quote")
    ) {
      if (prev && /^on\s.+wrote:/i.test(prevText)) return prev;
      return el;
    }
  }

  return null;
}

function topLevelUnder(root: HTMLElement, el: Element): Element {
  let current = el;
  while (current.parentElement && current.parentElement !== root) {
    current = current.parentElement;
  }
  return current;
}

function trimTrailingBreaks(nodes: Node[]) {
  while (nodes.length > 0) {
    const last = nodes[nodes.length - 1]!;
    if (
      last.nodeType === Node.ELEMENT_NODE &&
      (last as Element).tagName === "BR"
    ) {
      nodes.pop();
      continue;
    }
    if (last.nodeType === Node.TEXT_NODE && !(last.textContent ?? "").trim()) {
      nodes.pop();
      continue;
    }
    break;
  }
}

export function splitQuotedHtml(html: string): {
  visible: string;
  quoted: string | null;
} {
  if (typeof DOMParser === "undefined") {
    return { visible: html, quoted: null };
  }

  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.body;
  const quoteEl = findQuoteElement(root);
  if (!quoteEl) {
    return { visible: html, quoted: null };
  }

  const top = topLevelUnder(root, quoteEl);
  const children = Array.from(root.childNodes);
  const topIdx = children.indexOf(top);
  if (topIdx < 0) {
    return { visible: html, quoted: null };
  }

  const before = children.slice(0, topIdx);
  const after = children.slice(topIdx);
  trimTrailingBreaks(before);

  const visible = serializeChildren(before);
  const quoted = serializeChildren(after);

  if (isVisuallyEmptyHtml(visible) || isVisuallyEmptyHtml(quoted)) {
    return { visible: html, quoted: null };
  }

  return { visible, quoted };
}

export function splitQuotedText(text: string): {
  visible: string;
  quoted: string | null;
} {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  let splitAt = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (/^on\s.+wrote:$/i.test(line)) {
      splitAt = i;
      break;
    }
    if (/^-{2,}\s*original message\s*-{2,}$/i.test(line)) {
      splitAt = i;
      break;
    }
  }

  if (splitAt < 0) {
    const match = normalized.match(/\n\s*(On\s[\s\S]{0,200}?wrote:)\s*\n/i);
    if (match && match.index != null && match.index > 0) {
      const visible = normalized.slice(0, match.index).trimEnd();
      const quoted = normalized.slice(match.index).trimStart();
      if (visible && quoted) return { visible, quoted };
    }
    return { visible: text, quoted: null };
  }

  const visible = lines.slice(0, splitAt).join("\n").trimEnd();
  const quoted = lines.slice(splitAt).join("\n").trimStart();

  if (!visible.trim() || !quoted.trim()) {
    return { visible: text, quoted: null };
  }

  return { visible, quoted };
}

export function splitQuotedBody(args: {
  html?: string | null;
  text?: string | null;
}): {
  mode: "html" | "text";
  visible: string;
  quoted: string | null;
} {
  const html = args.html?.trim();
  if (html) {
    return { mode: "html", ...splitQuotedHtml(html) };
  }
  return { mode: "text", ...splitQuotedText(args.text ?? "") };
}
