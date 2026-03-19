CREATE TYPE "registration_status" AS ENUM ('registered', 'dropped', 'completed');

CREATE TABLE "StudentSubjectRegistration" (
    "id" UUID NOT NULL,
    "studentProfileId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "curriculumSubjectId" UUID NOT NULL,
    "registrationDate" DATE,
    "status" "registration_status" NOT NULL DEFAULT 'registered',
    "isAutoRegistered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudentSubjectRegistration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentSubjectRegistration_studentProfileId_curriculumSubjectId_key"
ON "StudentSubjectRegistration"("studentProfileId", "curriculumSubjectId");

CREATE INDEX "StudentSubjectRegistration_enrollmentId_status_idx"
ON "StudentSubjectRegistration"("enrollmentId", "status");

CREATE INDEX "StudentSubjectRegistration_curriculumSubjectId_status_idx"
ON "StudentSubjectRegistration"("curriculumSubjectId", "status");

ALTER TABLE "StudentSubjectRegistration"
ADD CONSTRAINT "StudentSubjectRegistration_studentProfileId_fkey"
FOREIGN KEY ("studentProfileId") REFERENCES "employee_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentSubjectRegistration"
ADD CONSTRAINT "StudentSubjectRegistration_enrollmentId_fkey"
FOREIGN KEY ("enrollmentId") REFERENCES "StudentEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentSubjectRegistration"
ADD CONSTRAINT "StudentSubjectRegistration_curriculumSubjectId_fkey"
FOREIGN KEY ("curriculumSubjectId") REFERENCES "CurriculumSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
