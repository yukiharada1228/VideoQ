ALTER TABLE "account" ALTER COLUMN "issuer" DROP DEFAULT;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_account_id_uidx" ON "account" USING btree ("issuer","account_id");