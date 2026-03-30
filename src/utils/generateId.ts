/** Generates a cryptographically random UUID for local record IDs. */
export function generateId(): string {
  return crypto.randomUUID();
}
