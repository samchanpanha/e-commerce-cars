import "dotenv/config";
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

async function main() {
  const url = process.env.DATABASE_URL ?? "file:./data/angkorev.db";
  const sql = readFileSync(new URL("../src/db/schema.sql", import.meta.url), "utf8");
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("PRAGMA"));
  const client = createClient({ url });
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (err) {
      console.error("FAILED:", stmt.slice(0, 120));
      throw err;
    }
  }
  console.log(`Schema applied to ${url} (${statements.length} statements).`);
}
main().catch((e) => { console.error(e); process.exit(1); });
