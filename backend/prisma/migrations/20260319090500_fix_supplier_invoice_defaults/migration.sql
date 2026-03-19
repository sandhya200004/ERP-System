ALTER TABLE "supplier_invoices"
ALTER COLUMN "status" SET DEFAULT 'pending',
ALTER COLUMN "payment_status" SET DEFAULT 'unpaid';
