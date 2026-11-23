/**
 * Only allow redirects to paths on this site (prevents open redirects
 * like `?next=https://evil.example` or `?next=//evil.example`).
 */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/dashboard";
  }
  return next;
}
