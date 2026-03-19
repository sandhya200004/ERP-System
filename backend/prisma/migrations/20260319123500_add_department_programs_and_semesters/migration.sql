CREATE TYPE "program_status" AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE "program_level" AS ENUM ('diploma', 'undergraduate', 'postgraduate', 'doctorate', 'certificate');
CREATE TYPE "semester_status" AS ENUM ('planned', 'active', 'completed', 'archived');

CREATE TABLE "DepartmentProgram" (
    "id" UUID NOT NULL,
    "departmentId" TEXT NOT NULL,
    "coordinatorProfileId" UUID,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "level" "program_level" NOT NULL DEFAULT 'undergraduate',
    "durationSemesters" INTEGER NOT NULL DEFAULT 8,
    "intakeCapacity" INTEGER,
    "status" "program_status" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DepartmentProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgramSemester" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "advisorProfileId" UUID,
    "semesterNumber" INTEGER NOT NULL,
    "section" TEXT,
    "academicYear" TEXT,
    "studentCapacity" INTEGER,
    "status" "semester_status" NOT NULL DEFAULT 'planned',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProgramSemester_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DepartmentProgram_departmentId_code_key" ON "DepartmentProgram"("departmentId", "code");
CREATE INDEX "DepartmentProgram_departmentId_status_idx" ON "DepartmentProgram"("departmentId", "status");
CREATE INDEX "DepartmentProgram_coordinatorProfileId_idx" ON "DepartmentProgram"("coordinatorProfileId");

CREATE UNIQUE INDEX "ProgramSemester_programId_semesterNumber_section_key" ON "ProgramSemester"("programId", "semesterNumber", "section");
CREATE INDEX "ProgramSemester_programId_status_idx" ON "ProgramSemester"("programId", "status");
CREATE INDEX "ProgramSemester_advisorProfileId_idx" ON "ProgramSemester"("advisorProfileId");

ALTER TABLE "DepartmentProgram"
ADD CONSTRAINT "DepartmentProgram_departmentId_fkey"
FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DepartmentProgram"
ADD CONSTRAINT "DepartmentProgram_coordinatorProfileId_fkey"
FOREIGN KEY ("coordinatorProfileId") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProgramSemester"
ADD CONSTRAINT "ProgramSemester_programId_fkey"
FOREIGN KEY ("programId") REFERENCES "DepartmentProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProgramSemester"
ADD CONSTRAINT "ProgramSemester_advisorProfileId_fkey"
FOREIGN KEY ("advisorProfileId") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
