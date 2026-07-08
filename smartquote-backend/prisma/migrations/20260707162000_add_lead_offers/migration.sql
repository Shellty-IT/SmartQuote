ALTER TABLE "offers" ADD COLUMN "leadId" TEXT;

ALTER TABLE "offers" ALTER COLUMN "clientId" DROP NOT NULL;

CREATE INDEX "offers_leadId_idx" ON "offers"("leadId");

ALTER TABLE "offers" ADD CONSTRAINT "offers_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "offers" ADD CONSTRAINT "offers_client_or_lead_check" CHECK (
    ("clientId" IS NOT NULL AND "leadId" IS NULL)
    OR ("clientId" IS NULL AND "leadId" IS NOT NULL)
);
