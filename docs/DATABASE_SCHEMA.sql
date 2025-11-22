-- ============================================
-- TriVerse ERP - PostgreSQL Database Schema
-- Version: 1.0.0
-- Description: Complete DDL for production-ready ERP/CRM
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE company_status AS ENUM ('active', 'inactive', 'trial');
CREATE TYPE branch_status AS ENUM ('active', 'inactive');
CREATE TYPE customer_type AS ENUM ('individual', 'business');
CREATE TYPE item_type AS ENUM ('goods', 'service');
CREATE TYPE tax_type AS ENUM ('gst', 'vat', 'sales_tax', 'other');
CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'accepted', 'rejected', 'expired', 'converted');
CREATE TYPE invoice_status AS ENUM ('draft', 'final', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'cheque', 'other');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
CREATE TYPE journal_entry_status AS ENUM ('draft', 'posted', 'voided');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'status_change', 'login', 'logout');

-- ============================================
-- 1. AUTHENTICATION & ORGANIZATION
-- ============================================

-- Companies (Multi-tenant support)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    logo_url TEXT,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) NOT NULL DEFAULT 'US',
    default_currency_code VARCHAR(3) NOT NULL DEFAULT 'USD',
    status company_status NOT NULL DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_companies_status ON companies(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_deleted ON companies(deleted_at);

-- Branches
CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    status branch_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_branch_code_per_company UNIQUE (company_id, code)
);

CREATE INDEX idx_branches_company ON branches(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_branches_status ON branches(status);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    avatar_url TEXT,
    status user_status NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMP,
    email_verified_at TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE revoked_at IS NULL;

-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_role_name_per_company UNIQUE (company_id, name)
);

CREATE INDEX idx_roles_company ON roles(company_id);

-- Permissions
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permissions_resource ON permissions(resource);

-- Role Permissions (Many-to-Many)
CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- User Roles (Many-to-Many with company/branch scope)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_role_company UNIQUE (user_id, role_id, company_id, branch_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_company ON user_roles(company_id);

-- ============================================
-- 2. MASTER DATA
-- ============================================

-- Currencies
CREATE TABLE currencies (
    code VARCHAR(3) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    decimal_places INT NOT NULL DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insert common currencies
INSERT INTO currencies (code, name, symbol, decimal_places) VALUES
('USD', 'US Dollar', '$', 2),
('EUR', 'Euro', '€', 2),
('GBP', 'British Pound', '£', 2),
('INR', 'Indian Rupee', '₹', 2),
('AUD', 'Australian Dollar', 'A$', 2),
('CAD', 'Canadian Dollar', 'C$', 2),
('JPY', 'Japanese Yen', '¥', 0);

-- FX Rates (Historical exchange rates)
CREATE TABLE fx_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    to_currency VARCHAR(3) NOT NULL REFERENCES currencies(code),
    rate DECIMAL(18, 6) NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_fx_rate_date UNIQUE (from_currency, to_currency, effective_date)
);

CREATE INDEX idx_fx_rates_currencies ON fx_rates(from_currency, to_currency, effective_date DESC);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    customer_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    customer_type customer_type NOT NULL DEFAULT 'business',
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    tax_id VARCHAR(100),
    billing_address_line1 VARCHAR(255),
    billing_address_line2 VARCHAR(255),
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),
    shipping_address_line1 VARCHAR(255),
    shipping_address_line2 VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100),
    default_currency_code VARCHAR(3) REFERENCES currencies(code),
    payment_terms_days INT DEFAULT 30,
    credit_limit DECIMAL(15, 2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_customer_number_per_company UNIQUE (company_id, customer_number)
);

CREATE INDEX idx_customers_company ON customers(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_customers_number ON customers(customer_number);
CREATE INDEX idx_customers_email ON customers(email);

-- Items (Products/Services)
CREATE TABLE items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    item_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type item_type NOT NULL DEFAULT 'goods',
    unit_price DECIMAL(15, 2) NOT NULL,
    cost_price DECIMAL(15, 2),
    default_currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
    unit_of_measure VARCHAR(50),
    sku VARCHAR(100),
    barcode VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_item_number_per_company UNIQUE (company_id, item_number)
);

CREATE INDEX idx_items_company ON items(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_items_number ON items(item_number);
CREATE INDEX idx_items_sku ON items(sku);

-- Taxes
CREATE TABLE taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    tax_type tax_type NOT NULL DEFAULT 'other',
    rate DECIMAL(5, 2) NOT NULL,
    jurisdiction VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_taxes_company ON taxes(company_id) WHERE deleted_at IS NULL;

-- Item Taxes (Many-to-Many: Items can have multiple default taxes)
CREATE TABLE item_taxes (
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    tax_id UUID NOT NULL REFERENCES taxes(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (item_id, tax_id)
);

-- ============================================
-- 3. SALES DOCUMENTS
-- ============================================

-- Quotes
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    quote_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    quote_date DATE NOT NULL,
    valid_until DATE,
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
    fx_rate DECIMAL(18, 6) NOT NULL DEFAULT 1.0,
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status quote_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    terms TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    sent_at TIMESTAMP,
    accepted_at TIMESTAMP,
    converted_to_invoice_id UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_quote_number_per_company UNIQUE (company_id, quote_number)
);

CREATE INDEX idx_quotes_company ON quotes(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_date ON quotes(quote_date DESC);

-- Quote Lines
CREATE TABLE quote_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_id UUID REFERENCES items(id),
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    subtotal DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_quote_line_number UNIQUE (quote_id, line_number)
);

CREATE INDEX idx_quote_lines_quote ON quote_lines(quote_id);

-- Quote Line Taxes
CREATE TABLE quote_line_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_line_id UUID NOT NULL REFERENCES quote_lines(id) ON DELETE CASCADE,
    tax_id UUID NOT NULL REFERENCES taxes(id),
    tax_rate DECIMAL(5, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quote_line_taxes_line ON quote_line_taxes(quote_line_id);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    invoice_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    quote_id UUID REFERENCES quotes(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
    fx_rate DECIMAL(18, 6) NOT NULL DEFAULT 1.0,
    subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0,
    amount_due DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status invoice_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    terms TEXT,
    journal_entry_id UUID,
    created_by UUID NOT NULL REFERENCES users(id),
    finalized_at TIMESTAMP,
    finalized_by UUID REFERENCES users(id),
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_invoice_number_per_company UNIQUE (company_id, invoice_number)
);

CREATE INDEX idx_invoices_company ON invoices(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Invoice Lines
CREATE TABLE invoice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    item_id UUID REFERENCES items(id),
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    subtotal DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_invoice_line_number UNIQUE (invoice_id, line_number)
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- Invoice Line Taxes
CREATE TABLE invoice_line_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_line_id UUID NOT NULL REFERENCES invoice_lines(id) ON DELETE CASCADE,
    tax_id UUID NOT NULL REFERENCES taxes(id),
    tax_rate DECIMAL(5, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_line_taxes_line ON invoice_line_taxes(invoice_line_id);

-- ============================================
-- 4. PAYMENTS
-- ============================================

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    payment_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
    fx_rate DECIMAL(18, 6) NOT NULL DEFAULT 1.0,
    payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
    reference_number VARCHAR(100),
    status payment_status NOT NULL DEFAULT 'completed',
    notes TEXT,
    journal_entry_id UUID,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_payment_number_per_company UNIQUE (company_id, payment_number)
);

CREATE INDEX idx_payments_company ON payments(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- Payment Applications (Link payments to invoices)
CREATE TABLE payment_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    amount DECIMAL(15, 2) NOT NULL,
    fx_gain_loss DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_applications_payment ON payment_applications(payment_id);
CREATE INDEX idx_payment_applications_invoice ON payment_applications(invoice_id);

-- ============================================
-- 5. ACCOUNTING ENGINE
-- ============================================

-- Chart of Accounts
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    account_type account_type NOT NULL,
    parent_account_id UUID REFERENCES accounts(id),
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
    is_active BOOLEAN DEFAULT TRUE,
    is_system_account BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT uq_account_number_per_company UNIQUE (company_id, account_number)
);

CREATE INDEX idx_accounts_company ON accounts(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_parent ON accounts(parent_account_id);

-- Journal Entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    status journal_entry_status NOT NULL DEFAULT 'draft',
    posted_at TIMESTAMP,
    posted_by UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_entry_number_per_company UNIQUE (company_id, entry_number)
);

CREATE INDEX idx_journal_entries_company ON journal_entries(company_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date DESC);
CREATE INDEX idx_journal_entries_reference ON journal_entries(reference_type, reference_id);
CREATE INDEX idx_journal_entries_status ON journal_entries(status);

-- Journal Lines
CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    line_number INT NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id),
    debit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    credit_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    currency_code VARCHAR(3) NOT NULL REFERENCES currencies(code),
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_journal_line_number UNIQUE (journal_entry_id, line_number),
    CONSTRAINT chk_debit_or_credit CHECK (
        (debit_amount > 0 AND credit_amount = 0) OR 
        (credit_amount > 0 AND debit_amount = 0)
    )
);

CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- ============================================
-- 6. PUBLIC FORMS & API
-- ============================================

-- Public Leads (From public quote request form)
CREATE TABLE public_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    message TEXT,
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    converted_to_customer_id UUID REFERENCES customers(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_public_leads_company ON public_leads(company_id);
CREATE INDEX idx_public_leads_status ON public_leads(status);
CREATE INDEX idx_public_leads_email ON public_leads(email);

-- API Keys
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    permissions JSONB DEFAULT '[]',
    rate_limit_per_minute INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP
);

CREATE INDEX idx_api_keys_company ON api_keys(company_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash) WHERE revoked_at IS NULL;

-- ============================================
-- 7. AUDIT LOGGING
-- ============================================

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- ============================================
-- 8. SEQUENCES & NUMBER GENERATION
-- ============================================

-- Document Number Sequences
CREATE TABLE number_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    document_type VARCHAR(50) NOT NULL,
    prefix VARCHAR(20),
    next_number INT NOT NULL DEFAULT 1,
    padding INT DEFAULT 5,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sequence_per_type UNIQUE (company_id, branch_id, document_type)
);

-- ============================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON currencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_taxes_updated_at BEFORE UPDATE ON taxes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate journal entry balance
CREATE OR REPLACE FUNCTION validate_journal_entry_balance()
RETURNS TRIGGER AS $$
DECLARE
    total_debit DECIMAL(15, 2);
    total_credit DECIMAL(15, 2);
BEGIN
    SELECT 
        COALESCE(SUM(debit_amount), 0),
        COALESCE(SUM(credit_amount), 0)
    INTO total_debit, total_credit
    FROM journal_lines
    WHERE journal_entry_id = NEW.id;
    
    IF total_debit != total_credit THEN
        RAISE EXCEPTION 'Journal entry must balance: Debit=% Credit=%', total_debit, total_credit;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_journal_balance
BEFORE UPDATE OF status ON journal_entries
FOR EACH ROW
WHEN (NEW.status = 'posted')
EXECUTE FUNCTION validate_journal_entry_balance();

-- ============================================
-- 10. INITIAL SEED DATA
-- ============================================

-- System permissions (to be expanded)
INSERT INTO permissions (name, resource, action, description) VALUES
('users.view', 'users', 'view', 'View users'),
('users.create', 'users', 'create', 'Create users'),
('users.edit', 'users', 'edit', 'Edit users'),
('users.delete', 'users', 'delete', 'Delete users'),
('customers.view', 'customers', 'view', 'View customers'),
('customers.create', 'customers', 'create', 'Create customers'),
('customers.edit', 'customers', 'edit', 'Edit customers'),
('customers.delete', 'customers', 'delete', 'Delete customers'),
('items.view', 'items', 'view', 'View items'),
('items.create', 'items', 'create', 'Create items'),
('items.edit', 'items', 'edit', 'Edit items'),
('items.delete', 'items', 'delete', 'Delete items'),
('quotes.view', 'quotes', 'view', 'View quotes'),
('quotes.create', 'quotes', 'create', 'Create quotes'),
('quotes.edit', 'quotes', 'edit', 'Edit quotes'),
('quotes.delete', 'quotes', 'delete', 'Delete quotes'),
('quotes.send', 'quotes', 'send', 'Send quotes'),
('quotes.convert', 'quotes', 'convert', 'Convert quotes to invoices'),
('invoices.view', 'invoices', 'view', 'View invoices'),
('invoices.create', 'invoices', 'create', 'Create invoices'),
('invoices.edit', 'invoices', 'edit', 'Edit invoices'),
('invoices.delete', 'invoices', 'delete', 'Delete invoices'),
('invoices.finalize', 'invoices', 'finalize', 'Finalize invoices'),
('invoices.send', 'invoices', 'send', 'Send invoices'),
('payments.view', 'payments', 'view', 'View payments'),
('payments.create', 'payments', 'create', 'Create payments'),
('payments.edit', 'payments', 'edit', 'Edit payments'),
('payments.delete', 'payments', 'delete', 'Delete payments'),
('reports.view', 'reports', 'view', 'View reports'),
('accounting.view', 'accounting', 'view', 'View accounting data'),
('accounting.edit', 'accounting', 'edit', 'Edit accounting data'),
('settings.view', 'settings', 'view', 'View settings'),
('settings.edit', 'settings', 'edit', 'Edit settings');

-- ============================================
-- END OF SCHEMA
-- ============================================
