-- CreateEnum
CREATE TYPE "po_status" AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'partially_received', 'received', 'cancelled');

-- CreateEnum
CREATE TYPE "grn_status" AS ENUM ('draft', 'received', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "stock_movement_type" AS ENUM ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "audit_action" ADD VALUE 'login_failed';
ALTER TYPE "audit_action" ADD VALUE 'unauthorized_access';
ALTER TYPE "audit_action" ADD VALUE 'permission_denied';
ALTER TYPE "audit_action" ADD VALUE 'data_export';
ALTER TYPE "audit_action" ADD VALUE 'password_change';
ALTER TYPE "audit_action" ADD VALUE 'role_change';
ALTER TYPE "audit_action" ADD VALUE 'system_down';

-- CreateTable
CREATE TABLE "vendors" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "vendor_number" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contact_person" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "tax_id" VARCHAR(100),
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100),
    "default_currency_code" VARCHAR(3),
    "payment_terms_days" INTEGER DEFAULT 30,
    "credit_limit" DECIMAL(15,2),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "po_number" VARCHAR(50) NOT NULL,
    "vendor_id" UUID NOT NULL,
    "order_date" DATE NOT NULL,
    "expected_date" DATE,
    "currency_code" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "po_status" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "terms" TEXT,
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_order_lines" (
    "id" UUID NOT NULL,
    "po_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "item_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "received_qty" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "grn_number" VARCHAR(50) NOT NULL,
    "po_id" UUID,
    "vendor_id" UUID NOT NULL,
    "receipt_date" DATE NOT NULL,
    "status" "grn_status" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "received_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_receipt_lines" (
    "id" UUID NOT NULL,
    "grn_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "item_id" UUID,
    "description" TEXT NOT NULL,
    "ordered_qty" DECIMAL(10,2),
    "received_qty" DECIMAL(10,2) NOT NULL,
    "warehouse_id" UUID,
    "location" VARCHAR(100),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_receipt_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_levels" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "warehouse_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reserved_qty" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "available_qty" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "reorder_point" DECIMAL(10,2),
    "reorder_quantity" DECIMAL(10,2),
    "last_counted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "movement_type" "stock_movement_type" NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "warehouse_id" UUID NOT NULL,
    "item_id" UUID NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_cost" DECIMAL(15,2),
    "movement_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendors_company_id_deleted_at_idx" ON "vendors"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "vendors_email_idx" ON "vendors"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_company_id_vendor_number_key" ON "vendors"("company_id", "vendor_number");

-- CreateIndex
CREATE INDEX "purchase_orders_company_id_deleted_at_idx" ON "purchase_orders"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "purchase_orders_vendor_id_idx" ON "purchase_orders"("vendor_id");

-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_company_id_po_number_key" ON "purchase_orders"("company_id", "po_number");

-- CreateIndex
CREATE INDEX "purchase_order_lines_po_id_idx" ON "purchase_order_lines"("po_id");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_order_lines_po_id_line_number_key" ON "purchase_order_lines"("po_id", "line_number");

-- CreateIndex
CREATE INDEX "goods_receipts_company_id_idx" ON "goods_receipts"("company_id");

-- CreateIndex
CREATE INDEX "goods_receipts_po_id_idx" ON "goods_receipts"("po_id");

-- CreateIndex
CREATE INDEX "goods_receipts_vendor_id_idx" ON "goods_receipts"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipts_company_id_grn_number_key" ON "goods_receipts"("company_id", "grn_number");

-- CreateIndex
CREATE INDEX "goods_receipt_lines_grn_id_idx" ON "goods_receipt_lines"("grn_id");

-- CreateIndex
CREATE UNIQUE INDEX "goods_receipt_lines_grn_id_line_number_key" ON "goods_receipt_lines"("grn_id", "line_number");

-- CreateIndex
CREATE INDEX "warehouses_company_id_deleted_at_idx" ON "warehouses"("company_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_company_id_code_key" ON "warehouses"("company_id", "code");

-- CreateIndex
CREATE INDEX "stock_levels_company_id_idx" ON "stock_levels"("company_id");

-- CreateIndex
CREATE INDEX "stock_levels_item_id_idx" ON "stock_levels"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "stock_levels_warehouse_id_item_id_key" ON "stock_levels"("warehouse_id", "item_id");

-- CreateIndex
CREATE INDEX "stock_movements_company_id_idx" ON "stock_movements"("company_id");

-- CreateIndex
CREATE INDEX "stock_movements_warehouse_id_idx" ON "stock_movements"("warehouse_id");

-- CreateIndex
CREATE INDEX "stock_movements_item_id_idx" ON "stock_movements"("item_id");

-- CreateIndex
CREATE INDEX "stock_movements_movement_date_idx" ON "stock_movements"("movement_date");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_order_lines" ADD CONSTRAINT "purchase_order_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "purchase_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipts" ADD CONSTRAINT "goods_receipts_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_grn_id_fkey" FOREIGN KEY ("grn_id") REFERENCES "goods_receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_receipt_lines" ADD CONSTRAINT "goods_receipt_lines_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warehouses" ADD CONSTRAINT "warehouses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_levels" ADD CONSTRAINT "stock_levels_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
