export function formatAddresses(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
}

const BARE_EMAIL_RE = /^[^\s<>"]+@[^\s<>"]+\.[^\s<>"]+$/;

export function parseEmailAddress(raw: string): { name: string; email: string } {
  const value = raw.trim();
  if (!value) return { name: "Unknown", email: "" };

  // Bare email must win before the "Name <email>" pattern — otherwise
  // user91@example.com is misread as name=user9, email=1@example.com.
  if (BARE_EMAIL_RE.test(value)) {
    const email = value.toLowerCase();
    return { name: email.split("@")[0] || email, email };
  }

  const angled = value.match(/^(?:"([^"]+)"|([^<]*?))\s*<\s*([^>]+@[^>]+)\s*>$/);
  if (angled) {
    const email = (angled[3] ?? "").trim().toLowerCase();
    const name = (angled[1] ?? angled[2] ?? "").trim() || email.split("@")[0] || email;
    return { name, email };
  }

  if (value.includes("@")) {
    const email = value.replace(/^<|>$/g, "").trim().toLowerCase();
    return { name: email.split("@")[0] || email, email };
  }

  return { name: value, email: "" };
}

/** RFC-ish mailbox: `Name <email@domain>` (or bare email when no name). */
export function formatMailbox(raw: string | { name?: string; email: string }): string {
  if (typeof raw === "string") {
    const parsed = parseEmailAddress(raw);
    if (!parsed.email) return parsed.name;
    if (!parsed.name || parsed.name.toLowerCase() === parsed.email) {
      return parsed.email;
    }
    return `${parsed.name} <${parsed.email}>`;
  }
  const email = raw.email.trim().toLowerCase();
  const name = raw.name?.trim();
  if (name && name.toLowerCase() !== email) return `${name} <${email}>`;
  return email;
}

export function displayNameFromAddress(raw: string) {
  return parseEmailAddress(raw).name;
}

export function emailFromAddress(raw: string) {
  return parseEmailAddress(raw).email;
}

export function shortRecipientLabel(raw: string) {
  const { name, email } = parseEmailAddress(raw);
  if (name && name !== email.split("@")[0]) return name;
  return email.split("@")[0] || name || "me";
}

export function mailedByDomain(email: string) {
  const at = email.lastIndexOf("@");
  if (at < 0) return "";
  return email.slice(at + 1);
}

export function initialsFromAddress(raw: string) {
  const name = displayNameFromAddress(raw);
  const parts = name.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

export function formatMailListDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  }

  if (d.getFullYear() === now.getFullYear()) {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(d);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatEmailDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));
}

export function formatRelativeEmailDate(date: string | Date) {
  const d = new Date(date);
  const absolute = formatEmailDate(d);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return `${absolute} (just now)`;
  if (mins < 60) {
    return `${absolute} (${mins} minute${mins === 1 ? "" : "s"} ago)`;
  }
  const hours = Math.round(mins / 60);
  if (hours < 24) {
    return `${absolute} (${hours} hour${hours === 1 ? "" : "s"} ago)`;
  }
  return absolute;
}
