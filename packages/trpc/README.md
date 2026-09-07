# @videoq/trpc

Hono API と React SPA が共有する tRPC 契約です。通常の JSON API はこの package
を経由し、Hono は認証・webhook・SSE・multipart・binary など HTTP transport 固有の
境界だけを担当します。

- `src/init.ts`: tRPC の初期化、認証・権限 middleware、共通 error shape
- `src/inputs/`: 機能単位の Zod input validation（入力型の定義元）
- `src/outputs.ts`: 全 procedure の出力スキーマ（出力型の定義元）
- `src/model-schemas.ts`: 共有 DTO の出力検証スキーマ
- `src/routers/`: 入出力スキーマ、認証・権限、query / mutation の接続
- `src/router.ts`: 各 feature router を束ねる app router
- `src/contracts.ts`: API adapter が実装する procedure の入出力契約
- `src/models.ts`: 出力スキーマから導出する API / SPA 共有 DTO 型
- `src/context.ts`: Hono adapter から注入する request context
- `src/schema.ts`: UI でも利用する runtime 定数

router はこの workspace 内で一度だけ初期化します。API 実装は `ctx.call()` の
adapter として分離し、SPA は `AppRouter` を type-only import するためサーバー実装を
bundle しません。

`RpcInputMap` は入力スキーマの `z.output` から導出し、handler は default / transform
適用後の値を受け取ります。入力構造を別の interface に再定義しません。

`RpcOutputMap` と共有 DTO も出力スキーマから導出します。全 procedure の `.output()`
で戻り値を検証し、未定義フィールドを除去します。出力検証の失敗は固定メッセージの
`INTERNAL_SERVER_ERROR` とし、入力検証エラーの詳細としてクライアントに公開しません。

タグの作成・更新・置換は共通の `tagColorSchema` でパレット名を検証します。
出力の色は保存済みの旧 hex 形式も読み取れるよう `string` としています。
`npm run typecheck` は `type-tests/` の入力型・handler 出力型の回帰チェックも実行します。

React の通常の JSON query / mutation は `@trpc/tanstack-react-query` の
`trpc.*.queryOptions()` / `mutationOptions()` と TanStack Query の hooks を利用します。
Vite SPA では client と QueryClient を共有し、Provider は `QueryClientProvider` だけです。
一覧全体の更新には `pathFilter()` を使い、通常 query と infinite query の両方を更新します。
`apps/web/src/lib/api.ts` は Better Auth、SSE、CSV、multipart / direct
upload、media URL のように tRPC では表現しない transport 専用 adapter です。
