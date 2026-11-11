/** The site's own origin, from the request, so the install line names whichever host served the page. */
export function siteFrom(h: Headers): string {
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https")
  return `${proto}://${host}`
}
