# @videoq/trpc

Hono API と React SPA が共有する tRPC 契約です。通常の JSON API はこの package
を経由し、Hono は認証・webhook・SSE・multipart・binary など HTTP transport 固有の
境界だけを担当します。

- `src/init.ts`: tRPC の初期化、認証・権限 middleware、共通 error shape
- `src/routers/`: 機能単位の router と Zod input validation
- `src/router.ts`: 各 feature router を束ねる app router
- `src/contracts.ts`: API adapter が実装する procedure の入出力契約
- `src/models.ts`: API と SPA で共有する DTO 型
- `src/context.ts`: Hono adapter から注入する request context
- `src/schema.ts`: UI でも利用する runtime 定数

router はこの workspace 内で一度だけ初期化します。API 実装は `ctx.call()` の
adapter として分離し、SPA は `AppRouter` を type-only import するためサーバー実装を
bundle しません。

React の通常の JSON query / mutation は `trpc.*.useQuery()` / `useMutation()` を直接
利用します。`apps/web/src/lib/api.ts` は Better Auth、SSE、CSV、multipart / direct
upload、media URL のように tRPC では表現しない transport 専用 adapter です。
