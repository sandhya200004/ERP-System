-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "check_in" TIMESTAMP(3) NOT NULL,
    "check_out" TIMESTAMP(3),
    "check_in_latitude" VARCHAR(50),
    "check_in_longitude" VARCHAR(50),
    "check_in_location" VARCHAR(255),
    "check_in_notes" TEXT,
    "check_out_latitude" VARCHAR(50),
    "check_out_longitude" VARCHAR(50),
    "check_out_notes" TEXT,
    "hours_worked" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_user_id_date_idx" ON "attendance"("user_id", "date");

-- CreateIndex
CREATE INDEX "attendance_company_id_date_idx" ON "attendance"("company_id", "date");

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
