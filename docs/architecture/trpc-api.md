# tRPC API 設計

## 方針

VideoQ の通常の JSON API は tRPC に統一します。React と Hono の間で
`AppRouter` を共有し、procedure 名、input validation、入出力型を一つの契約として
管理します。OpenAPI schema と API reference UI は生成しません。

```mermaid
flowchart LR
    React[React SPA] --> Client[tRPC client]
    Client --> Endpoint[/api/trpc]
    Endpoint --> Hono[Hono middleware]
    Hono --> Router[shared AppRouter]
    Router --> Adapter[request-scoped handlers]
    Adapter --> Service[feature services]
    Service --> Repository[repositories]
```

## Workspace 境界

```text
packages/trpc/
├── src/init.ts          tRPC 初期化、認証・権限 middleware、error formatter
├── src/routers/         domain router と Zod input
├── src/router.ts        AppRouter の合成
├── src/contracts.ts     handler が実装する procedure 入出力 map
├── src/models.ts        API / SPA 共有 DTO
├── src/context.ts       framework 非依存の request context
└── src/schema.ts        runtime 共有定数

apps/api/src/trpc/
├── context.ts           Hono request から auth と handler を組み立てる
└── handlers/            service を procedure 契約へ接続する

apps/web/src/lib/
├── trpc.ts              batch client、401、ApiError 変換
└── api.ts               Better Auth・SSE・CSV・upload・media URL adapter
```

`packages/trpc` は Hono、DB、Cloudflare bindings に依存しません。API 実装は
`ctx.call()` の adapter として注入し、Web は `AppRouter` を type-only import します。

## 認証と権限

- `publicProcedure`: 公開情報、または share token を handler で検証する操作
- `protectedProcedure`: Better Auth の browser session が必要
- `adminProcedure`: superuser を遅延検証

Integration API key と OAuth Bearer は MCP transport 専用です。通常のtRPC、SSE、
CSV、multipart upload、media routeの認証には利用しません。

## Hono に残す endpoint

HTTP protocol または payload transport 自体に意味があるものだけ raw route とします。

- Better Auth と OAuth / OIDC discovery
- Stripe webhook
- MCP Streamable HTTP
- health / readiness
- media binary
- multipart video upload
- chat SSE
- chat history CSV export

新しい通常 JSON 操作は Hono route へ追加せず、`packages/trpc/src/routers` と
`apps/api/src/trpc/handlers` に procedure を追加します。

## Error contract

tRPC の標準 error code / HTTP status に加え、既存 UI が判断に使う
`applicationCode` と field validation の `details` を error data に保持します。
内部エラーの message は公開時に固定文へ置き換えます。
