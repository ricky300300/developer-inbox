/**
 * Public origin for absolute URLs (e.g. webhook links shown in Settings).
 * Prefer the current request host so local / Vercel / custom domains Just Work.
 * Optional NEXT_PUBLIC_APP_URL overrides when the Host header is wrong
 * (rare proxies, or when you must advertise a tunnel URL while browsing localhost).
 */
export function getRequestOrigin(request: Request): string {
  const override = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (override) {
    return override;
  }

  const hostHeader =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!hostHeader) {
    return "";
  }

  const host = hostHeader.split(",")[0]?.trim() ?? "";
  if (!host) {
    return "";
  }

  const protoHeader = request.headers.get("x-forwarded-proto");
  const proto = (
    protoHeader?.split(",")[0]?.trim() ||
    (host.startsWith("localhost") || host.startsWith("127.0.0.1")
      ? "http"
      : "https")
  ).replace(/:$/, "");

  return `${proto}://${host}`;
}
