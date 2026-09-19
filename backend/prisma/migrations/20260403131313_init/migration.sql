-- CreateEnum
CREATE TYPE "attendance_status" AS ENUM ('present', 'absent', 'late', 'excused');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "user_role_type" ADD VALUE 'TEACHER';
ALTER TYPE "user_role_type" ADD VALUE 'PRINCIPAL';
ALTER TYPE "user_role_type" ADD VALUE 'PARENT';
ALTER TYPE "user_role_type" ADD VALUE 'ACCOUNTANT';
ALTER TYPE "user_role_type" ADD VALUE 'LIBRARIAN';
ALTER TYPE "user_role_type" ADD VALUE 'WARDEN';
ALTER TYPE "user_role_type" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "attendance" ADD COLUMN     "approved_by" UUID,
ADD COLUMN     "correction_reason" TEXT,
ADD COLUMN     "is_correction" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "attendance_status" NOT NULL DEFAULT 'present',
ALTER COLUMN "check_in" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "attendance_status_idx" ON "attendance"("status");

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "StudentSubjectRegistration_studentProfileId_curriculumSubjectId" RENAME TO "StudentSubjectRegistration_studentProfileId_curriculumSubje_key";
