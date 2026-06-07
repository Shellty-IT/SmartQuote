-- AddColumn: templateType and blocks to offers table
ALTER TABLE "offers" ADD COLUMN "templateType" TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE "offers" ADD COLUMN "blocks" JSONB;
