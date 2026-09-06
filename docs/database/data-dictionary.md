# データ辞書

完全な型、default、constraint、index はdomain dataについて
`apps/api/src/db/schema/modern.ts`、認証について
`apps/api/src/db/schema/better-auth.ts`を正本とします。

## 認証

| テーブル | 用途 |
|---|---|
| `users` | Better Auth user、quota、Stripe 課金、暗号化済み外部 key |
| `stripe_events` | Stripe webhook の冪等（event id） |
| `session` | Better Auth cookie session と期限 |
| `account` | credential password hash とGoogle等のprovider account |
| `verification` | メール確認・password reset・email change の一回限り token |
| `apikey` | MCP integration key のhash、prefix、accessLevel metadata |
| `jwks` | OAuth access token署名用の鍵 |
| `account_deletion_requests` | アカウント削除依頼 |

認証テーブルの完全な列定義は `apps/api/src/db/schema/better-auth.ts` を正本とします。

## 動画・整理

| テーブル | 用途 |
|---|---|
| `videos` | file、title、source、transcript、processing status |
| `video_courses` | user の講座と share slug |
| `video_course_members` | course と video の関連・表示順 |
| `tags` | user 単位の tag |
| `video_tags` | video と tag の関連 |

## チャット・評価

| テーブル | 用途 |
|---|---|
| `chat_logs` | question、answer、citation、feedback |
| `chat_log_evaluations` | log 単位の評価 |
| `course_evaluation_snapshots` | course 集計 snapshot |

## Vector / PLOG

| テーブル | 用途 |
|---|---|
| `scene_embeddings` | LangChain標準列、filter可能なuser / video metadata columns、JSON metadata |
| `plog_build_jobs` | build status |
| `plog_summary_nodes` | summary hierarchy |
| `plog_concepts` | concept |
| `plog_edges` | concept relation |
| `plog_learning_objects` | concept の learning object |
| `learner_concept_states` | user ごとの学習状態 |

`scene_embeddings.embedding` の次元は設定した embedding model と一致させます。

## OAuth / OIDC

| テーブル | 用途 |
|---|---|
| `oauth_client` | DCRで登録されたMCP client metadata |
| `oauth_resource` | MCP resource identifier、scope policy、token TTL |
| `oauth_client_resource` | clientとresource identifierの許可関係 |
| `oauth_access_token` | resource-bound JWT access tokenの発行記録 |
| `oauth_refresh_token` | refresh tokenとrotation/replay情報 |
| `oauth_consent` | userがclientへ許可したscope/resource |
| `oauth_client_assertion` | private_key_jwt assertionのreplay防止 |

## 共通規則

- ID は bigint identity または UUID
- 日時は `TIMESTAMPTZ`、API 出力は UTC ISO-8601
- owner / parent relation は FK
- 関連テーブルは複合 unique で重複を防止
- secret は hash または AES-256-GCM envelope で保存
