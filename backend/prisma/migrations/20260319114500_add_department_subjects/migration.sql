CREATE TYPE "subject_type" AS ENUM ('core', 'elective', 'lab');

CREATE TYPE "subject_status" AS ENUM ('active', 'inactive', 'archived');

CREATE TABLE "DepartmentSubject" (
    "id" UUID NOT NULL,
    "departmentId" TEXT NOT NULL,
    "teacherProfileId" UUID,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" "subject_type" NOT NULL DEFAULT 'core',
    "status" "subject_status" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentSubject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DepartmentSubject_departmentId_code_key" ON "DepartmentSubject"("departmentId", "code");
CREATE INDEX "DepartmentSubject_departmentId_status_idx" ON "DepartmentSubject"("departmentId", "status");
CREATE INDEX "DepartmentSubject_teacherProfileId_idx" ON "DepartmentSubject"("teacherProfileId");

ALTER TABLE "DepartmentSubject"
ADD CONSTRAINT "DepartmentSubject_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DepartmentSubject"
ADD CONSTRAINT "DepartmentSubject_teacherProfileId_fkey"
FOREIGN KEY ("teacherProfileId") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
