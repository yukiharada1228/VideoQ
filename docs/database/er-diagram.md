# ER 図

現行 Drizzle schema の主要リレーションを示します。完全な定義は
`apps/api/src/db/schema/modern.ts` と `apps/api/src/db/schema/better-auth.ts` を正本とします。

```mermaid
erDiagram
    USERS ||--o{ SESSION : owns
    USERS ||--o{ ACCOUNT : owns
    USERS ||--o{ APIKEY : owns
    USERS ||--o{ VIDEOS : owns
    USERS ||--o{ VIDEO_COURSES : owns
    USERS ||--o{ TAGS : owns
    USERS ||--o{ ACCOUNT_DELETION_REQUESTS : creates

    VIDEO_COURSES ||--o{ VIDEO_COURSE_MEMBERS : contains
    VIDEOS ||--o{ VIDEO_COURSE_MEMBERS : belongs
    VIDEOS ||--o{ VIDEO_TAGS : has
    TAGS ||--o{ VIDEO_TAGS : labels

    USERS ||--o{ CHAT_LOGS : creates
    VIDEO_COURSES ||--o{ CHAT_LOGS : has
    CHAT_LOGS ||--o| CHAT_LOG_EVALUATIONS : evaluated

    VIDEOS ||--o{ SCENE_EMBEDDINGS : indexed
    VIDEOS ||--o{ PLOG_BUILD_JOBS : builds
    VIDEOS ||--o{ PLOG_CONCEPTS : contains
    PLOG_CONCEPTS ||--o{ PLOG_EDGES : source
    PLOG_CONCEPTS ||--o{ PLOG_EDGES : target
    PLOG_CONCEPTS ||--o{ PLOG_LEARNING_OBJECTS : has
    PLOG_CONCEPTS ||--o{ LEARNER_CONCEPT_STATES : tracks

    USERS ||--o{ OAUTH_CLIENT : registers
    USERS ||--o{ OAUTH_CONSENT : grants
    OAUTH_CLIENT ||--o{ OAUTH_CLIENT_RESOURCE : allows
    OAUTH_RESOURCE ||--o{ OAUTH_CLIENT_RESOURCE : identifies
    OAUTH_CLIENT ||--o{ OAUTH_ACCESS_TOKEN : issues
    OAUTH_CLIENT ||--o{ OAUTH_REFRESH_TOKEN : issues
```

## 認証テーブル

- `session`, `account`, `verification`: Better Authのbrowser認証
- `apikey`: MCP用`vq_...` keyのhash、prefix、accessLevel metadata
- `oauth_*`, `jwks`: MCP OAuth 2.1、DCR、resource-bound token

## コンテンツテーブル

- `videos`, `video_courses`, `video_course_members`
- `tags`, `video_tags`
- `chat_logs`, `chat_log_evaluations`, `course_evaluation_snapshots`
- `scene_embeddings`
- `plog_*`, `learner_concept_states`

## 制約方針

- 所有関係は FK で表現
- user / parent 削除時の関連行は schema 定義の cascade 方針に従う
- session tokenとOAuth tokenの一意性、API key lookup indexはBetter Auth schemaで管理
- course member、video tag などの重複関係は複合 unique
- vector 次元は設定した embedding model と一致させる
