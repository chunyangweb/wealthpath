/**
 * Generate a short unique ID for cashflow rows.
 *
 * Uses crypto.randomUUID() when available (all modern browsers since 2022),
 * with a fallback for older environments. Not cryptographically critical —
 * these IDs only need to be unique within one user's data.
 */
export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
