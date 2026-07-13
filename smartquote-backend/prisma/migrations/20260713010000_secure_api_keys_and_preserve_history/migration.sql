ALTER TABLE "api_keys" ADD COLUMN "prefix" TEXT;
ALTER TABLE "api_keys" ADD COLUMN "last_four" TEXT;

UPDATE "api_keys"
SET
    "prefix" = LEFT("key", 8),
    "last_four" = RIGHT("key", 4),
    "key" = 'legacy-disabled-' || "id",
    "isActive" = false;

ALTER TABLE "api_keys" ALTER COLUMN "prefix" SET NOT NULL;
ALTER TABLE "api_keys" ALTER COLUMN "last_four" SET NOT NULL;

DROP INDEX IF EXISTS "api_keys_key_idx";

ALTER TABLE "offers" DROP CONSTRAINT "offers_clientId_fkey";
ALTER TABLE "offers" DROP CONSTRAINT "offers_leadId_fkey";
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_clientId_fkey";

ALTER TABLE "offers" ADD CONSTRAINT "offers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "offers" ADD CONSTRAINT "offers_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
