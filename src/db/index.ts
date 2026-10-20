import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "file:./data/angkorev.db";

// Reuse the client across HMR reloads in development.
const globalForDb = globalThis as unknown as { __aevClient?: Client };
export const client: Client = globalForDb.__aevClient ?? createClient({ url });
if (process.env.NODE_ENV !== "production") globalForDb.__aevClient = client;

export const db = drizzle(client, { schema });
export { schema };
export type Db = typeof db;
