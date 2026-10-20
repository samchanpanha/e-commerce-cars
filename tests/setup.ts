import "dotenv/config";

process.env.DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/angkorev.db";
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-not-for-production";
