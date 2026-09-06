-- drizzle-kit:custom
-- Data migration generated with:
--   npm run db:generate -- --custom --name invalidate_legacy_oauth_grants
--
-- Better Auth 1.7 changes resource-bound token semantics. Existing external
-- OAuth grants cannot be upgraded safely, so clients must register again.
-- Browser sessions and social-login accounts are stored separately and remain.
DELETE FROM "oauth_access_token";--> statement-breakpoint
DELETE FROM "oauth_refresh_token";--> statement-breakpoint
DELETE FROM "oauth_consent";--> statement-breakpoint
DELETE FROM "oauth_client";
