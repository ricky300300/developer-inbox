export function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(re|fwd|fw)\s*:\s*/gi, "")
    .trim()
    .toLowerCase();
}

export function normalizeParticipants(
  emails: Array<string | { email: string }>,
): string {
  const set = new Set(
    emails.map((e) => (typeof e === "string" ? e : e.email).toLowerCase().trim()),
  );
  return [...set].sort().join(",");
}

export function formatMailboxAddress(
  address: string | { email: string; name?: string },
): string {
  if (typeof address === "string") {
    const value = address.trim();
    if (!value) return value;
    // Already formatted or bare — normalize via angled form when possible
    const angled = value.match(/^(?:"([^"]+)"|([^<]*?))\s*<\s*([^>]+@[^>]+)\s*>$/);
    if (angled) {
      const email = (angled[3] ?? "").trim().toLowerCase();
      const name = (angled[1] ?? angled[2] ?? "").trim();
      return name ? `${name} <${email}>` : email;
    }
    return value.toLowerCase();
  }
  const email = address.email.trim().toLowerCase();
  const name = address.name?.trim();
  return name ? `${name} <${email}>` : email;
}

export function formatAddresses(
  addresses: Array<string | { email: string; name?: string }>,
): string {
  return addresses.map(formatMailboxAddress).join(", ");
}
