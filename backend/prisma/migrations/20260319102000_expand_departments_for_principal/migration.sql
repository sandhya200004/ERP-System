CREATE TYPE "department_status" AS ENUM ('active', 'inactive', 'archived');

ALTER TABLE "Department"
ADD COLUMN "description" TEXT,
ADD COLUMN "status" "department_status" NOT NULL DEFAULT 'active',
ADD COLUMN "hodProfileId" UUID,
ADD COLUMN "contactEmail" TEXT,
ADD COLUMN "contactPhone" TEXT,
ADD COLUMN "location" TEXT;

CREATE UNIQUE INDEX "Department_hodProfileId_key" ON "Department"("hodProfileId");
CREATE INDEX "Department_status_idx" ON "Department"("status");

ALTER TABLE "Department"
ADD CONSTRAINT "Department_hodProfileId_fkey" FOREIGN KEY ("hodProfileId") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
