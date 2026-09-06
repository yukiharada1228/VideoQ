import { defineConfig } from "drizzle-kit";

/**
 * アプリケーションschemaの正本。
 * 既存 Neon には baseline 済み想定 — `drizzle-kit push` で破壊的変更しないこと。
 * 新規 DDL は schema を変更して `drizzle-kit generate --name ...` → migrate。
 * 生成された SQL / snapshot / journal は編集しない。データ移行だけ
 * `drizzle-kit generate --custom --name ...` を使う。
 */
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:55432/postgres",
  },
  strict: true,
  verbose: true,
});
