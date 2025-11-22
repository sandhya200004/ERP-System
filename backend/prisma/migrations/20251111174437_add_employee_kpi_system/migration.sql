-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "company_status" AS ENUM ('active', 'inactive', 'trial');

-- CreateEnum
CREATE TYPE "branch_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "customer_type" AS ENUM ('individual', 'business');

-- CreateEnum
CREATE TYPE "item_type" AS ENUM ('goods', 'service');

-- CreateEnum
CREATE TYPE "tax_type" AS ENUM ('gst', 'vat', 'sales_tax', 'other');

-- CreateEnum
CREATE TYPE "quote_status" AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted');

-- CreateEnum
CREATE TYPE "invoice_status" AS ENUM ('draft', 'final', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'cheque', 'other');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "account_type" AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');

-- CreateEnum
CREATE TYPE "journal_entry_status" AS ENUM ('draft', 'posted', 'voided');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('create', 'update', 'delete', 'status_change', 'login', 'logout');

-- CreateEnum
CREATE TYPE "task_status" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "task_priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "user_role_type" AS ENUM ('CEO', 'CTO', 'CMO', 'HR', 'MANAGER', 'DEVELOPER', 'DESIGNER', 'MARKETING', 'RND', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "legal_name" VARCHAR(255),
    "registration_number" VARCHAR(100),
    "tax_id" VARCHAR(100),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "website" VARCHAR(255),
    "logo_url" TEXT,
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100) NOT NULL DEFAULT 'US',
    "default_currency_code" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "status" "company_status" NOT NULL DEFAULT 'active',
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "address_line1" VARCHAR(255),
    "address_line2" VARCHAR(255),
    "city" VARCHAR(100),
    "state" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "country" VARCHAR(100),
    "status" "branch_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(50),
    "avatar_url" TEXT,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMP(3),
    "email_verified_at" TIMESTAMP(3),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(500) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "branch_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "code" VARCHAR(3) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "symbol" VARCHAR(10) NOT NULL,
    "decimal_places" INTEGER NOT NULL DEFAULT 2,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "fx_rates" (
    "id" UUID NOT NULL,
    "from_currency" VARCHAR(3) NOT NULL,
    "to_currency" VARCHAR(3) NOT NULL,
    "rate" DECIMAL(18,6) NOT NULL,
    "effective_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "customer_number" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "customer_type" "customer_type" NOT NULL DEFAULT 'business',
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "website" VARCHAR(255),
    "tax_id" VARCHAR(100),
    "billing_address_line1" VARCHAR(255),
    "billing_address_line2" VARCHAR(255),
    "billing_city" VARCHAR(100),
    "billing_state" VARCHAR(100),
    "billing_postal_code" VARCHAR(20),
    "billing_country" VARCHAR(100),
    "shipping_address_line1" VARCHAR(255),
    "shipping_address_line2" VARCHAR(255),
    "shipping_city" VARCHAR(100),
    "shipping_state" VARCHAR(100),
    "shipping_postal_code" VARCHAR(20),
    "shipping_country" VARCHAR(100),
    "default_currency_code" VARCHAR(3),
    "payment_terms_days" INTEGER DEFAULT 30,
    "credit_limit" DECIMAL(15,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "item_number" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "item_type" "item_type" NOT NULL DEFAULT 'goods',
    "unit_price" DECIMAL(15,2) NOT NULL,
    "cost_price" DECIMAL(15,2),
    "default_currency_code" VARCHAR(3) NOT NULL,
    "unit_of_measure" VARCHAR(50),
    "sku" VARCHAR(100),
    "barcode" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxes" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "tax_type" "tax_type" NOT NULL DEFAULT 'other',
    "rate" DECIMAL(5,2) NOT NULL,
    "jurisdiction" VARCHAR(100),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_taxes" (
    "item_id" UUID NOT NULL,
    "tax_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_taxes_pkey" PRIMARY KEY ("item_id","tax_id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "branch_id" UUID,
    "quote_number" VARCHAR(50) NOT NULL,
    "customer_id" UUID NOT NULL,
    "quote_date" DATE NOT NULL,
    "valid_until" DATE,
    "currency_code" VARCHAR(3) NOT NULL,
    "fx_rate" DECIMAL(18,6) NOT NULL DEFAULT 1.0,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "quote_status" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "terms" TEXT,
    "created_by" UUID NOT NULL,
    "sent_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "converted_to_invoice_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_lines" (
    "id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "item_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_line_taxes" (
    "id" UUID NOT NULL,
    "quote_line_id" UUID NOT NULL,
    "tax_id" UUID NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_line_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "branch_id" UUID,
    "invoice_number" VARCHAR(50) NOT NULL,
    "customer_id" UUID NOT NULL,
    "quote_id" UUID,
    "invoice_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "fx_rate" DECIMAL(18,6) NOT NULL DEFAULT 1.0,
    "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount_paid" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "amount_due" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" "invoice_status" NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "terms" TEXT,
    "journal_entry_id" UUID,
    "created_by" UUID NOT NULL,
    "finalized_at" TIMESTAMP(3),
    "finalized_by" UUID,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_lines" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "item_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_taxes" (
    "id" UUID NOT NULL,
    "invoice_line_id" UUID NOT NULL,
    "tax_id" UUID NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "tax_amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_line_taxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "payment_number" VARCHAR(50) NOT NULL,
    "customer_id" UUID NOT NULL,
    "payment_date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "fx_rate" DECIMAL(18,6) NOT NULL DEFAULT 1.0,
    "payment_method" "payment_method" NOT NULL DEFAULT 'bank_transfer',
    "reference_number" VARCHAR(100),
    "status" "payment_status" NOT NULL DEFAULT 'completed',
    "notes" TEXT,
    "journal_entry_id" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_applications" (
    "id" UUID NOT NULL,
    "payment_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "fx_gain_loss" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "account_number" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "account_type" "account_type" NOT NULL,
    "parent_account_id" UUID,
    "currency_code" VARCHAR(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system_account" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "entry_number" VARCHAR(50) NOT NULL,
    "entry_date" DATE NOT NULL,
    "reference_type" VARCHAR(50),
    "reference_id" UUID,
    "description" TEXT,
    "status" "journal_entry_status" NOT NULL DEFAULT 'draft',
    "posted_at" TIMESTAMP(3),
    "posted_by" UUID,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" UUID NOT NULL,
    "journal_entry_id" UUID NOT NULL,
    "line_number" INTEGER NOT NULL,
    "account_id" UUID NOT NULL,
    "debit_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency_code" VARCHAR(3) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_leads" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "company_name" VARCHAR(255),
    "message" TEXT,
    "source" VARCHAR(100),
    "status" VARCHAR(50) NOT NULL DEFAULT 'new',
    "converted_to_customer_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "key_hash" VARCHAR(255) NOT NULL,
    "key_prefix" VARCHAR(20) NOT NULL,
    "permissions" JSONB DEFAULT '[]',
    "rate_limit_per_minute" INTEGER NOT NULL DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "company_id" UUID,
    "user_id" UUID,
    "action" "audit_action" NOT NULL,
    "entity_type" VARCHAR(100) NOT NULL,
    "entity_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "number_sequences" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "branch_id" UUID,
    "document_type" VARCHAR(50) NOT NULL,
    "prefix" VARCHAR(20),
    "next_number" INTEGER NOT NULL DEFAULT 1,
    "padding" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "number_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_tasks" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "priority" "task_priority" NOT NULL DEFAULT 'medium',
    "status" "task_status" NOT NULL DEFAULT 'pending',
    "hours_spent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "employee_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "employee_id" VARCHAR(50) NOT NULL,
    "designation" VARCHAR(100) NOT NULL,
    "department" VARCHAR(100) NOT NULL,
    "role" "user_role_type" NOT NULL,
    "date_of_joining" DATE NOT NULL,
    "reporting_to_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_status_deleted_at_idx" ON "companies"("status", "deleted_at");

-- CreateIndex
CREATE INDEX "branches_company_id_deleted_at_idx" ON "branches"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "branches_status_idx" ON "branches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "branches_company_id_code_key" ON "branches"("company_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_deleted_at_idx" ON "users"("email", "deleted_at");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_revoked_at_idx" ON "refresh_tokens"("token", "revoked_at");

-- CreateIndex
CREATE INDEX "roles_company_id_idx" ON "roles"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_company_id_name_key" ON "roles"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE INDEX "permissions_resource_idx" ON "permissions"("resource");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_company_id_idx" ON "user_roles"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_company_id_branch_id_key" ON "user_roles"("user_id", "role_id", "company_id", "branch_id");

-- CreateIndex
CREATE INDEX "fx_rates_from_currency_to_currency_effective_date_idx" ON "fx_rates"("from_currency", "to_currency", "effective_date");

-- CreateIndex
CREATE UNIQUE INDEX "fx_rates_from_currency_to_currency_effective_date_key" ON "fx_rates"("from_currency", "to_currency", "effective_date");

-- CreateIndex
CREATE INDEX "customers_company_id_deleted_at_idx" ON "customers"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "customers_customer_number_idx" ON "customers"("customer_number");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_company_id_customer_number_key" ON "customers"("company_id", "customer_number");

-- CreateIndex
CREATE INDEX "items_company_id_deleted_at_idx" ON "items"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "items_item_number_idx" ON "items"("item_number");

-- CreateIndex
CREATE INDEX "items_sku_idx" ON "items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "items_company_id_item_number_key" ON "items"("company_id", "item_number");

-- CreateIndex
CREATE INDEX "taxes_company_id_deleted_at_idx" ON "taxes"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "quotes_company_id_deleted_at_idx" ON "quotes"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "quotes_customer_id_idx" ON "quotes"("customer_id");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quotes_quote_date_idx" ON "quotes"("quote_date");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_company_id_quote_number_key" ON "quotes"("company_id", "quote_number");

-- CreateIndex
CREATE INDEX "quote_lines_quote_id_idx" ON "quote_lines"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "quote_lines_quote_id_line_number_key" ON "quote_lines"("quote_id", "line_number");

-- CreateIndex
CREATE INDEX "quote_line_taxes_quote_line_id_idx" ON "quote_line_taxes"("quote_line_id");

-- CreateIndex
CREATE INDEX "invoices_company_id_deleted_at_idx" ON "invoices"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "invoices_customer_id_idx" ON "invoices"("customer_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_invoice_date_idx" ON "invoices"("invoice_date");

-- CreateIndex
CREATE INDEX "invoices_due_date_idx" ON "invoices"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_company_id_invoice_number_key" ON "invoices"("company_id", "invoice_number");

-- CreateIndex
CREATE INDEX "invoice_lines_invoice_id_idx" ON "invoice_lines"("invoice_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_lines_invoice_id_line_number_key" ON "invoice_lines"("invoice_id", "line_number");

-- CreateIndex
CREATE INDEX "invoice_line_taxes_invoice_line_id_idx" ON "invoice_line_taxes"("invoice_line_id");

-- CreateIndex
CREATE INDEX "payments_company_id_deleted_at_idx" ON "payments"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "payments_customer_id_idx" ON "payments"("customer_id");

-- CreateIndex
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_company_id_payment_number_key" ON "payments"("company_id", "payment_number");

-- CreateIndex
CREATE INDEX "payment_applications_payment_id_idx" ON "payment_applications"("payment_id");

-- CreateIndex
CREATE INDEX "payment_applications_invoice_id_idx" ON "payment_applications"("invoice_id");

-- CreateIndex
CREATE INDEX "accounts_company_id_deleted_at_idx" ON "accounts"("company_id", "deleted_at");

-- CreateIndex
CREATE INDEX "accounts_account_type_idx" ON "accounts"("account_type");

-- CreateIndex
CREATE INDEX "accounts_parent_account_id_idx" ON "accounts"("parent_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_company_id_account_number_key" ON "accounts"("company_id", "account_number");

-- CreateIndex
CREATE INDEX "journal_entries_company_id_idx" ON "journal_entries"("company_id");

-- CreateIndex
CREATE INDEX "journal_entries_entry_date_idx" ON "journal_entries"("entry_date");

-- CreateIndex
CREATE INDEX "journal_entries_reference_type_reference_id_idx" ON "journal_entries"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "journal_entries_status_idx" ON "journal_entries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_company_id_entry_number_key" ON "journal_entries"("company_id", "entry_number");

-- CreateIndex
CREATE INDEX "journal_lines_journal_entry_id_idx" ON "journal_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "journal_lines_account_id_idx" ON "journal_lines"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "journal_lines_journal_entry_id_line_number_key" ON "journal_lines"("journal_entry_id", "line_number");

-- CreateIndex
CREATE INDEX "public_leads_company_id_idx" ON "public_leads"("company_id");

-- CreateIndex
CREATE INDEX "public_leads_status_idx" ON "public_leads"("status");

-- CreateIndex
CREATE INDEX "public_leads_email_idx" ON "public_leads"("email");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_hash_key" ON "api_keys"("key_hash");

-- CreateIndex
CREATE INDEX "api_keys_company_id_idx" ON "api_keys"("company_id");

-- CreateIndex
CREATE INDEX "api_keys_key_hash_revoked_at_idx" ON "api_keys"("key_hash", "revoked_at");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_idx" ON "audit_logs"("company_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "number_sequences_company_id_branch_id_document_type_key" ON "number_sequences"("company_id", "branch_id", "document_type");

-- CreateIndex
CREATE INDEX "employee_tasks_user_id_date_idx" ON "employee_tasks"("user_id", "date");

-- CreateIndex
CREATE INDEX "employee_tasks_company_id_date_idx" ON "employee_tasks"("company_id", "date");

-- CreateIndex
CREATE INDEX "employee_tasks_status_idx" ON "employee_tasks"("status");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_user_id_key" ON "employee_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_profiles_employee_id_key" ON "employee_profiles"("employee_id");

-- CreateIndex
CREATE INDEX "employee_profiles_employee_id_idx" ON "employee_profiles"("employee_id");

-- CreateIndex
CREATE INDEX "employee_profiles_department_idx" ON "employee_profiles"("department");

-- CreateIndex
CREATE INDEX "employee_profiles_role_idx" ON "employee_profiles"("role");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_default_currency_code_fkey" FOREIGN KEY ("default_currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branches" ADD CONSTRAINT "branches_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_from_currency_fkey" FOREIGN KEY ("from_currency") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_to_currency_fkey" FOREIGN KEY ("to_currency") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_default_currency_code_fkey" FOREIGN KEY ("default_currency_code") REFERENCES "currencies"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_default_currency_code_fkey" FOREIGN KEY ("default_currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taxes" ADD CONSTRAINT "taxes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_taxes" ADD CONSTRAINT "item_taxes_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_taxes" ADD CONSTRAINT "item_taxes_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_converted_to_invoice_id_fkey" FOREIGN KEY ("converted_to_invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_lines" ADD CONSTRAINT "quote_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_taxes" ADD CONSTRAINT "quote_line_taxes_quote_line_id_fkey" FOREIGN KEY ("quote_line_id") REFERENCES "quote_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_line_taxes" ADD CONSTRAINT "quote_line_taxes_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_finalized_by_fkey" FOREIGN KEY ("finalized_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_taxes" ADD CONSTRAINT "invoice_line_taxes_invoice_line_id_fkey" FOREIGN KEY ("invoice_line_id") REFERENCES "invoice_lines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_taxes" ADD CONSTRAINT "invoice_line_taxes_tax_id_fkey" FOREIGN KEY ("tax_id") REFERENCES "taxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_applications" ADD CONSTRAINT "payment_applications_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_applications" ADD CONSTRAINT "payment_applications_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_currency_code_fkey" FOREIGN KEY ("currency_code") REFERENCES "currencies"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_leads" ADD CONSTRAINT "public_leads_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_leads" ADD CONSTRAINT "public_leads_converted_to_customer_id_fkey" FOREIGN KEY ("converted_to_customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "number_sequences" ADD CONSTRAINT "number_sequences_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_tasks" ADD CONSTRAINT "employee_tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_tasks" ADD CONSTRAINT "employee_tasks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_profiles" ADD CONSTRAINT "employee_profiles_reporting_to_id_fkey" FOREIGN KEY ("reporting_to_id") REFERENCES "employee_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
