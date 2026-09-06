# apps/

VideoQ の実行パッケージです。

| ディレクトリ | 役割 | ランタイム |
|---|---|---|
| [`api/`](api/) | tRPC API と protocol transport | Hono / Cloudflare Workers |
| [`web/`](web/) | ブラウザアプリ | React / Vite |
| [`worker/`](worker/) | 文字起こし・索引・PLOG・評価などの非同期処理 | Python / SQS Lambda |

Node.js パッケージはリポジトリルートの npm workspace で管理します。

```bash
npm ci
npm run dev:api
npm run dev:web
```

ローカル全体起動:

```bash
docker compose up --build -d
```

フロントエンドの HMR が必要な場合:

```bash
docker compose --profile dev up -d web-dev
```
