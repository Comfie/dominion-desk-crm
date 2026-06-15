-- Add explicit link from tenant portal accounts to tenant profiles
ALTER TABLE "Tenant"
ADD COLUMN IF NOT EXISTS "portalUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_portalUserId_key"
ON "Tenant"("portalUserId");

ALTER TABLE "Tenant"
ADD CONSTRAINT "Tenant_portalUserId_fkey"
FOREIGN KEY ("portalUserId")
REFERENCES "User"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

