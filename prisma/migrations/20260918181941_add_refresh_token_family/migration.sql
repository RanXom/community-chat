-- Add familyId as nullable first so existing sessions can be migrated.
ALTER TABLE "RefreshToken"
ADD COLUMN "familyId" TEXT;

-- Existing tokens predate token-family tracking.
-- Give each existing token its own family.
UPDATE "RefreshToken"
SET "familyId" = "id"
WHERE "familyId" IS NULL;

-- New tokens must always belong to a family.
ALTER TABLE "RefreshToken"
ALTER COLUMN "familyId" SET NOT NULL;

-- Allow efficient family-wide revocation.
CREATE INDEX "RefreshToken_familyId_idx"
ON "RefreshToken"("familyId");
