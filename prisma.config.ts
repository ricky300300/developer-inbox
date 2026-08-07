import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Migrations must use a direct/session Postgres URL — not Supabase
 * transaction pooler (:6543), which hangs on migrate.
 *
 * Prefer DIRECT_URL (db.*.supabase.co:5432 or pooler :5432 session mode).
 * Fall back to DATABASE_URL for local Postgres.
 */
const migrateUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!migrateUrl) {
  throw new Error(
    "Set DIRECT_URL (recommended for Supabase) or DATABASE_URL for Prisma migrations",
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: migrateUrl,
  },
});
