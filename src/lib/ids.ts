import { randomBytes, randomUUID } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newId(prefix?: string): string {
  const id = randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

/** Human-readable, non-guessable public reference (used for AI reports). */
export function publicRef(prefix = "AEV-RPT"): string {
  const bytes = randomBytes(5);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `${prefix}-${out}`;
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\u1780-\u17ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export function token(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}
