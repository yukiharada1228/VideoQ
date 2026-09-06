import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types/bindings";

/**
 * API レスポンス共通のセキュリティヘッダー。
 *
 * JSON、SSE、binary response に共通する防御を適用する。
 * API 自体は HTML を返さないため frame 埋め込みを禁止する。
 */
export const securityHeaders = createMiddleware<AppEnv>(async (c, next) => {
  await next();
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  c.res.headers.set("X-Frame-Options", "DENY");
  c.res.headers.set("Content-Security-Policy", "frame-ancestors 'none'");
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
});
