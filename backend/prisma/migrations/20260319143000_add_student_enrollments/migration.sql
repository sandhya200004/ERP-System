CREATE TYPE "enrollment_status" AS ENUM ('active', 'promoted', 'graduated', 'dropped', 'deferred');

CREATE TABLE "StudentEnrollment" (
    "id" UUID NOT NULL,
    "studentProfileId" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "semesterId" UUID NOT NULL,
    "rollNumber" TEXT,
    "academicYear" TEXT,
    "admissionDate" DATE,
    "status" "enrollment_status" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentEnrollment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentEnrollment_studentProfileId_key" ON "StudentEnrollment"("studentProfileId");
CREATE INDEX "StudentEnrollment_programId_status_idx" ON "StudentEnrollment"("programId", "status");
CREATE INDEX "StudentEnrollment_semesterId_status_idx" ON "StudentEnrollment"("semesterId", "status");
CREATE INDEX "StudentEnrollment_academicYear_idx" ON "StudentEnrollment"("academicYear");

ALTER TABLE "StudentEnrollment"
ADD CONSTRAINT "StudentEnrollment_studentProfileId_fkey"
FOREIGN KEY ("studentProfileId") REFERENCES "employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentEnrollment"
ADD CONSTRAINT "StudentEnrollment_programId_fkey"
FOREIGN KEY ("programId") REFERENCES "DepartmentProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentEnrollment"
ADD CONSTRAINT "StudentEnrollment_semesterId_fkey"
FOREIGN KEY ("semesterId") REFERENCES "ProgramSemester"("id") ON DELETE CASCADE ON UPDATE CASCADE;
