// Where to send a learner after sign-in: a path on this site, never another origin.
// Same rule as the server's safeReturn (server/sign-in-methods.js): starts with one "/", no backslashes,
// printable ASCII, at most 512 characters. "/.//evil.example" resolves to "//evil.example", so it is refused.
export function safeReturnPath(value: string | null | undefined): string | null {
  if (!value || typeof window === 'undefined') return null;
  let url: URL;
  try { url = new URL(value, window.location.origin); } catch { return null; }
  if (url.origin !== window.location.origin) return null;
  const path = url.pathname + url.search + url.hash;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || path.length > 512 || /[^\x20-\x7e]/.test(path)) return null;
  return path;
}
