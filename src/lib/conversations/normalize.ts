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

export function formatAddresses(
  addresses: Array<string | { email: string; name?: string }>,
): string {
  return addresses
    .map((a) => (typeof a === "string" ? a : a.email).toLowerCase().trim())
    .join(",");
}
