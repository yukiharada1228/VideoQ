-- drizzle-kit:custom
-- Data migration generated with:
--   npm run db:generate -- --custom --name backfill_better_auth_issuer
--
-- Better Auth 1.7 identifies an account by (issuer, account_id). Preserve the
-- former provider-scoped identity before the final unique index is installed.
UPDATE "account"
SET "issuer" = CASE
	WHEN "provider_id" = 'credential' THEN 'local:credential'
	ELSE 'local:oauth:' || "provider_id"
END
WHERE "issuer" = '__videoq_migration_pending__';
