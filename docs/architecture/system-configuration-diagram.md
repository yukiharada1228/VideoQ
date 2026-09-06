# システム構成図

## 本番

```mermaid
flowchart TB
    User[Browser / API client / MCP client]
    Pages[Cloudflare Pages<br/>React SPA]
    API[Cloudflare Workers<br/>Hono + tRPC]
    HD[Cloudflare Hyperdrive]
    Neon[(Neon PostgreSQL<br/>pgvector)]
    R2[(Cloudflare R2)]
    DO[Durable Objects<br/>Rate limiter / Study session]
    Email[Mailgun<br/>Transactional email]
    SQS[Amazon SQS]
    Lambda[Python Lambda worker]
    AI[OpenAI / external AI]

    User --> Pages
    User --> API
    API --> HD --> Neon
    API --> R2
    API --> DO
    API --> Email
    API --> SQS --> Lambda
    Lambda --> Neon
    Lambda --> R2
    API --> AI
    Lambda --> AI
```

## ローカル

```mermaid
flowchart LR
    Browser --> Caddy
    Caddy --> Web[nginx static React build]
    Caddy --> API[wrangler dev / Hono]
    API --> Postgres[(PostgreSQL + pgvector)]
    API --> MinIO[(MinIO)]
    API --> ElasticMQ[ElasticMQ]
    ElasticMQ --> Worker[Python worker]
    Worker --> Postgres
    Worker --> MinIO
```

`docker compose up --build -d` で上記を起動します。UI の HMR は
`docker compose --profile dev up -d web-dev` で追加します。

## セキュリティ境界

- browser session: Better Auth の HttpOnly cookie session
- MCP integration: hash 保存された `vq_...` API key、またはOAuth 2.1
- OAuth client: PKCE、resource audienceに束縛したJWT access token、refresh token
- user secret: AES-256-GCM
- DB: Worker から Hyperdrive 経由
- object storage: 署名 URL または認可済み API stream
- rate limit / study session: Durable Objects
- transactional email: Mailgun
