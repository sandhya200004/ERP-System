-- CreateEnum for task status
CREATE TYPE "task_submission_status" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateTable for kpi_tasks
CREATE TABLE IF NOT EXISTS "kpi_tasks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "company_id" UUID NOT NULL,
    "assigned_to" UUID NOT NULL,
    "assigned_by" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "weightage" INTEGER NOT NULL DEFAULT 10,
    "deadline" TIMESTAMP(3),
    "status" task_submission_status NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpi_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable for kpi_submissions
CREATE TABLE IF NOT EXISTS "kpi_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "task_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "submission_note" TEXT,
    "feedback" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by" UUID,

    CONSTRAINT "kpi_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kpi_tasks_assigned_to_idx" ON "kpi_tasks"("assigned_to");
CREATE INDEX "kpi_tasks_company_id_idx" ON "kpi_tasks"("company_id");
CREATE INDEX "kpi_tasks_status_idx" ON "kpi_tasks"("status");

CREATE INDEX "kpi_submissions_task_id_idx" ON "kpi_submissions"("task_id");
CREATE INDEX "kpi_submissions_user_id_idx" ON "kpi_submissions"("user_id");

-- AddForeignKey
ALTER TABLE "kpi_tasks" ADD CONSTRAINT "kpi_tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kpi_tasks" ADD CONSTRAINT "kpi_tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kpi_tasks" ADD CONSTRAINT "kpi_tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "kpi_submissions" ADD CONSTRAINT "kpi_submissions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "kpi_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kpi_submissions" ADD CONSTRAINT "kpi_submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "kpi_submissions" ADD CONSTRAINT "kpi_submissions_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
