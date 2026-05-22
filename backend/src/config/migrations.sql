-- Incremental migrations (safe to re-run)

ALTER TABLE users ADD COLUMN IF NOT EXISTS tax_type VARCHAR(20) DEFAULT 'GST';
ALTER TABLE users ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5, 2) DEFAULT 18.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cgst_rate DECIMAL(5, 2) DEFAULT 9.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sgst_rate DECIMAL(5, 2) DEFAULT 9.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS igst_rate DECIMAL(5, 2) DEFAULT 18.00;

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'Other',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(100),
    vendor VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Invoice numbers unique per user (not globally)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_key;
DROP INDEX IF EXISTS idx_invoices_user_invoice_number;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_user_invoice_number
  ON invoices(user_id, invoice_number);

ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);

-- Refresh tokens for production auth
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_date ON invoices(user_id, invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_user_status ON invoices(user_id, status);
