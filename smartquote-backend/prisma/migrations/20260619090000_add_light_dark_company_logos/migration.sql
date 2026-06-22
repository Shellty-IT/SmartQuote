ALTER TABLE "company_info"
ADD COLUMN "logoLight" TEXT,
ADD COLUMN "logoDark" TEXT;

UPDATE "company_info"
SET "logoLight" = "logo"
WHERE "logoLight" IS NULL AND "logo" IS NOT NULL;
