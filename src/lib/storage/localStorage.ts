import type { z, ZodTypeAny } from 'zod';

/**
 * Typed localStorage wrapper.
 *
 * All keys are namespaced under `wealthpath:` so we never collide with anything
 * else stored by the browser. All reads validate against a Zod schema; if the
 * stored data is corrupt or shape-changed, the read returns null and the caller
 * falls back to defaults. This is essential because schema migrations during
 * development would otherwise crash the app for anyone with old data.
 */

const NAMESPACE = 'wealthpath:';

function key(name: string): string {
  return NAMESPACE + name;
}

function isAvailable(): boolean {
  try {
    const testKey = key('__probe');
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    // Private browsing modes or storage-disabled environments
    return false;
  }
}

const available = typeof window !== 'undefined' && isAvailable();

export function readValidated<S extends ZodTypeAny>(
  name: string,
  schema: S,
): z.infer<S> | null {
  if (!available) return null;
  try {
    const raw = window.localStorage.getItem(key(name));
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    const result = schema.safeParse(parsed);
    if (!result.success) {
      // Corrupt or out-of-date stored data — log once, return null
      console.warn(`[storage] discarding invalid ${name}:`, result.error.message);
      return null;
    }
    return result.data;
  } catch (err) {
    console.warn(`[storage] failed to read ${name}:`, err);
    return null;
  }
}

export function write<T>(name: string, value: T): void {
  if (!available) return;
  try {
    window.localStorage.setItem(key(name), JSON.stringify(value));
  } catch (err) {
    // Quota exceeded or other failure — non-fatal
    console.warn(`[storage] failed to write ${name}:`, err);
  }
}

export function remove(name: string): void {
  if (!available) return;
  try {
    window.localStorage.removeItem(key(name));
  } catch {
    // ignore
  }
}
