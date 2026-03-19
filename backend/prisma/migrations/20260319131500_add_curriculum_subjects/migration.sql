CREATE TYPE "curriculum_subject_status" AS ENUM ('planned', 'active', 'archived');

CREATE TABLE "CurriculumSubject" (
    "id" UUID NOT NULL,
    "semesterId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "facultyProfileId" UUID,
    "academicYear" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 4,
    "theoryHours" INTEGER NOT NULL DEFAULT 3,
    "labHours" INTEGER NOT NULL DEFAULT 0,
    "internalWeightage" INTEGER NOT NULL DEFAULT 40,
    "externalWeightage" INTEGER NOT NULL DEFAULT 60,
    "isElective" BOOLEAN NOT NULL DEFAULT false,
    "status" "curriculum_subject_status" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CurriculumSubject_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CurriculumSubject_semesterId_subjectId_key" ON "CurriculumSubject"("semesterId", "subjectId");
CREATE INDEX "CurriculumSubject_semesterId_status_idx" ON "CurriculumSubject"("semesterId", "status");
CREATE INDEX "CurriculumSubject_subjectId_idx" ON "CurriculumSubject"("subjectId");
CREATE INDEX "CurriculumSubject_facultyProfileId_idx" ON "CurriculumSubject"("facultyProfileId");

ALTER TABLE "CurriculumSubject"
ADD CONSTRAINT "CurriculumSubject_semesterId_fkey"
FOREIGN KEY ("semesterId") REFERENCES "ProgramSemester"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CurriculumSubject"
ADD CONSTRAINT "CurriculumSubject_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "DepartmentSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CurriculumSubject"
ADD CONSTRAINT "CurriculumSubject_facultyProfileId_fkey"
FOREIGN KEY ("facultyProfileId") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
