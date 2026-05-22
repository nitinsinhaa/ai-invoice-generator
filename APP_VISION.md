# AI Invoice Generator — Product Model

## One-line pitch

**AI-powered business finance for small teams:** send invoices, track what customers owe you, record expenses, manage stock, and get AI insights — in one place.

## What makes it different

| Typical apps | This app |
|--------------|----------|
| Invoice OR expenses OR inventory as separate tools | One flow: **Invoice → Stock ↓ → Payment → Revenue** |
| AI only for marketing copy | AI on **descriptions, tax, categories, customer fill, business insights** |
| “Transactions” = everything mixed | Clear split: **Invoices (bills)**, **Sales (money in)**, **Expenses (money out)**, **Wallet (cash)** |

## Module map (what each screen is for)

### Invoices
**Purpose:** Official bill you send to a customer (accounts receivable).

- Creates `invoices` + `invoice_items`
- **Reduces inventory stock** when line items use a product from Inventory
- **Does not count as revenue until PAID**
- When marked **Paid** → records a **Sale** in Sales History and optional `payments` row

### Sales History (sidebar: was “Transactions”)
**Purpose:** Ledger of money **in** and **out** that hit your books.

- **Income** rows appear when an invoice is **marked paid** (or created as paid)
- **Expense** rows only if you add manual adjustments via API (optional); day-to-day expenses live on **Expenses** page

### Expenses
**Purpose:** Money you spend to run the business (rent, ads, software, etc.).

- Stored in `expenses` table only
- **AI auto-category** from description
- Feeds Dashboard “Total Expenses”

### Inventory
**Purpose:** Products/services you sell with **stock count**.

- Stock goes **down** when you issue an invoice with that product
- Stock does **not** change on Expenses or Wallet

### My Wallet
**Purpose:** Cash you hold (deposits / withdrawals), separate from invoicing.

- Not the same as “revenue from invoices”
- Use for petty cash, bank top-ups, owner drawings

### Dashboard
**Purpose:** Summary for a time period.

- **Revenue** = sum of **paid invoices** in range
- **Expenses** = sum of **expenses** in range
- **Net profit** = revenue − expenses
- **AI insights** = plain-language summary from your numbers

## Status flows

```
Invoice:  pending → paid | overdue | cancelled
          (revenue only when paid)

Expense:  pending → paid (manual)

Wallet:   deposit | withdrawal
```

## AI touchpoints

1. Invoice line description generation
2. Tax rate suggestion (GST/VAT)
3. Expense category from description
4. Customer detail suggestions
5. Dashboard business insights narrative
6. Recurring invoice suggestion (API ready)
