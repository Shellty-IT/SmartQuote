-- AlterTable
ALTER TABLE "user_settings" ADD COLUMN     "emailProvider" TEXT NOT NULL DEFAULT 'smtp',
ADD COLUMN     "resendApiKey" TEXT,
ADD COLUMN     "resendConfigured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resendFromEmail" TEXT,
ADD COLUMN     "resendFromName" TEXT;
