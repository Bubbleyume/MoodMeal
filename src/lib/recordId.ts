// Local record identifiers, not authentication tokens. Works on HTTP LAN previews.
let sequence = 0;
export function createRecordId(): string {
  const crypto = globalThis.crypto;
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
  if (typeof crypto?.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  }
  return `local-${Date.now().toString(36)}-${(sequence++).toString(36)}-${Math.random().toString(36).slice(2)}`;
}
