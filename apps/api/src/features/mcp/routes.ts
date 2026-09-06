import type { Context } from "hono";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { StreamableHTTPTransport } from "@hono/mcp";
import {
  oauthBearerMethod,
  bearerApiKeyMethod,
  apiKeyMethod,
  isScopeAllowed,
  requireScope,
} from "../../middleware/auth";
import { MCP_READ_SCOPE } from "../../lib/mcp-auth";
import { toErrorBody } from "../../shared/errors";
import type { AppEnv } from "../../types/bindings";
import { createVideoqMcpServer } from "./server";

/**
 * MCP Streamable HTTP（@hono/mcp）。
 * 認証順: OAuth Bearer → Bearer API キー → X-API-Key/ApiKey。
 * 読み取りツールは read_only キーでも利用でき、書き込みツールは個別に拒否する。
 */
export const mcpRoutes = new Hono<AppEnv>();

function mcpWwwAuthenticate(
  c: Context<AppEnv>,
  error?: "insufficient_scope",
): string {
  const issuer = (
    c.env.OAUTH_ISSUER_URL || new URL(c.req.url).origin
  ).replace(/\/$/, "");
  const meta = `${issuer}/.well-known/oauth-protected-resource/api/mcp`;
  const challenge = `Bearer realm="api",resource_metadata="${meta}",scope="${MCP_READ_SCOPE}"`;
  return error ? `${challenge},error="${error}"` : challenge;
}

const mcpAuth = createMiddleware<AppEnv>(async (c, next) => {
  for (const method of [oauthBearerMethod, bearerApiKeyMethod, apiKeyMethod]) {
    const r = await method(c);
    if (r.kind === "ok") {
      c.set("userId", r.userId);
      c.set("authVia", r.via);
      if (r.accessLevel) c.set("apiKeyAccessLevel", r.accessLevel);
      return next();
    }
    if (r.kind === "invalid") {
      return c.json(toErrorBody("UNAUTHORIZED", r.message), 401, {
        "WWW-Authenticate": mcpWwwAuthenticate(c),
      });
    }
    if (r.kind === "forbidden") {
      return c.json(toErrorBody("FORBIDDEN", r.message), 403, {
        "WWW-Authenticate": mcpWwwAuthenticate(c, "insufficient_scope"),
      });
    }
  }
  return c.json(
    toErrorBody("UNAUTHORIZED", "Authentication credentials were not provided."),
    401,
    { "WWW-Authenticate": mcpWwwAuthenticate(c) },
  );
});

/**
 * 一部クライアントは Accept に片方しか付けない。
 * GET は text/event-stream（またはワイルドカード）が必要なので補完する。
 */
const normalizeMcpAccept = createMiddleware<AppEnv>(async (c, next) => {
  const accept = c.req.header("Accept") ?? "";
  const hasJson = accept.includes("application/json") || accept.includes("*/*");
  const hasSse =
    accept.includes("text/event-stream") || accept.includes("*/*");
  if (!hasJson || !hasSse) {
    try {
      c.req.raw.headers.set("Accept", "application/json, text/event-stream");
    } catch {
      // Request headers が immutable な runtime ではそのまま進める。
    }
  }
  return next();
});

mcpRoutes.use("*", normalizeMcpAccept, mcpAuth, requireScope("read"));

mcpRoutes.all("/", async (c) => {
  const transport = new StreamableHTTPTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = createVideoqMcpServer({
    env: c.env,
    userId: c.var.userId!,
    authVia: c.var.authVia,
    requestId: c.var.requestId,
    canWrite: isScopeAllowed(c.var.apiKeyAccessLevel ?? "", "write"),
  });
  await server.connect(transport);
  return transport.handleRequest(c);
});
