-- AddColumn: tokenVersion to users table
-- Bumped on password change so previously issued JWTs (7-day expiry) stop
-- authenticating immediately, instead of remaining valid until they expire.
ALTER TABLE "users" ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 0;
