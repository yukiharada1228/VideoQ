import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";

const databaseUrl = process.env.QUOTA_TEST_DATABASE_URL;
const migrationDirectory = fileURLToPath(
  new URL("../drizzle", import.meta.url),
);
const journal = JSON.parse(
  readFileSync(new URL("../drizzle/meta/_journal.json", import.meta.url), "utf8"),
) as { entries: unknown[] };
const migrationDescribe = databaseUrl ? describe : describe.skip;

migrationDescribe("Drizzle greenfield migration chain", () => {
  it("applies every migration to an empty PostgreSQL database", async () => {
    const databaseName = `videoq_drizzle_${crypto.randomUUID().replaceAll("-", "")}`;
    const adminPool = new Pool({ connectionString: databaseUrl });
    // node-postgres requires a Pool error listener; without one, a background
    // error on an idle client crashes the process instead of just being ignored.
    // `DROP DATABASE ... WITH (FORCE)` in the `finally` block below races with our
    // own `pool.end()` above it and can surface exactly such an error here.
    adminPool.on("error", () => {});
    const adminDb = drizzle(adminPool);
    const targetUrl = new URL(databaseUrl!);
    targetUrl.pathname = `/${databaseName}`;
    let targetPool: Pool | undefined;

    try {
      await adminDb.execute(sql.raw(`CREATE DATABASE "${databaseName}"`));
      targetPool = new Pool({ connectionString: targetUrl.toString(), max: 1 });
      targetPool.on("error", () => {});
      const db = drizzle(targetPool);

      await migrate(db, { migrationsFolder: migrationDirectory });

      const result = await db.execute(sql.raw(`
        SELECT
          (SELECT count(*)::integer FROM drizzle.__drizzle_migrations) AS migration_count,
          to_regclass('public.users')::text AS users_table,
          to_regclass('public.mcp_idempotency_records')::text AS mcp_table,
          to_regclass('public.oauth_resource')::text AS oauth_resource_table
      `));
      expect(result.rows[0]).toEqual({
        migration_count: journal.entries.length,
        users_table: "users",
        mcp_table: "mcp_idempotency_records",
        oauth_resource_table: "oauth_resource",
      });
    } finally {
      await targetPool?.end();
      await adminDb.execute(
        sql.raw(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE)`),
      );
      await adminPool.end();
    }
  });
});
