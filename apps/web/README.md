# VideoQ Frontend

React、TypeScript、Viteで構築したVideoQのフロントエンドです。

## 開発

```bash
cd ../..
npm ci
npm run dev:web
```

主な確認コマンド：

```bash
npm run typecheck --workspace @videoq/web
npm run lint --workspace @videoq/web
npm test --workspace @videoq/web
npm run build --workspace @videoq/web
```

## API client

SPA 内部の型付き API は `@videoq/trpc` の `AppRouter` を共有し、
`/api/trpc` へ接続します。`src/main.tsx` の `QueryClientProvider` でキャッシュを共有し、
`src/lib/trpc.ts` に client と `@trpc/tanstack-react-query` の options proxy を定義します。
画面とhookは `useQuery(trpc.*.queryOptions(input))` /
`useMutation(trpc.*.mutationOptions())` を使います。`src/lib/api.ts` は
SSE、multipart / direct upload、CSV、media URL、Better Authのように
tRPCでは表現しないprotocol専用adapterだけを持ちます。

## Cloudflare Pages

Git連携のビルド設定は次の値を使用します。

| 設定 | 値 |
|---|---|
| ルートディレクトリ | `apps/web` |
| ビルドコマンド | `npm run build` |
| ビルド出力 | `dist` |
| ビルド監視パス | `apps/web/*`, `packages/trpc/*`, `package.json`, `package-lock.json` |

依存関係はrepository rootのnpm workspaceと`package-lock.json`で管理します。
Cloudflare Pages側のルートディレクトリを変更した場合も、上記の監視パスを同期してください。

## Digital Agency UI

使用中のコンポーネントだけを同期します。

```bash
npm run ui:check # dry-run
npm run ui:sync  # 同期
```

対象は `scripts/sync-digital-agency-ui.mjs` で管理します。
