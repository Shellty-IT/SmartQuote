-- AddColumns: templateType and blocks to contracts table
ALTER TABLE "contracts" ADD COLUMN "templateType" TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE "contracts" ADD COLUMN "blocks" JSONB;
