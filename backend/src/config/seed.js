import pool from './database.js';
import { hashPassword } from '../utils/encryption.js';

const SEED_EMAIL = process.env.SEED_EMAIL || 'demo@aiinvoice.com';
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'demo123456';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function toDateString(d) {
  return d.toISOString().split('T')[0];
}

async function clearUserData(client, userId) {
  await client.query('DELETE FROM wallet_transactions WHERE wallet_id IN (SELECT id FROM wallets WHERE user_id = $1)', [userId]);
  await client.query('DELETE FROM payments WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM transactions WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM expenses WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE user_id = $1)', [userId]);
  await client.query('DELETE FROM invoices WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM products WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM customers WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM bank_accounts WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM settings WHERE user_id = $1', [userId]);
  await client.query('DELETE FROM wallets WHERE user_id = $1', [userId]);
}

async function seedUserData(client, userId) {
    // Wallet
    const walletResult = await client.query(
      `INSERT INTO wallets (user_id, balance, currency) VALUES ($1, $2, $3) RETURNING id`,
      [userId, 125000, 'INR']
    );
    const walletId = walletResult.rows[0].id;

    // Bank accounts
    await client.query(
      `INSERT INTO bank_accounts (user_id, account_name, account_number, bank_name, routing_number, account_type, is_primary)
       VALUES ($1, 'Business Account', '123456789012', 'HDFC Bank', 'HDFC0001234', 'current', true),
              ($1, 'Savings Account', '987654321098', 'ICICI Bank', 'ICIC0009876', 'savings', false)`,
      [userId]
    );

    // Customers
    const customers = (
      await client.query(
        `INSERT INTO customers (user_id, name, email, phone, company, city, country)
         VALUES
           ($1, 'Acme Corporation', 'billing@acme.com', '+91 99887 76655', 'Acme Corp', 'Mumbai', 'India'),
           ($1, 'Bright Retail Ltd', 'accounts@brightretail.in', '+91 88776 65544', 'Bright Retail', 'Delhi', 'India'),
           ($1, 'CloudNine Services', 'finance@cloudnine.io', '+91 77665 54433', 'CloudNine', 'Bangalore', 'India'),
           ($1, 'Delta Manufacturing', 'payables@delta.in', '+91 66554 43322', 'Delta Mfg', 'Pune', 'India')
         RETURNING id, name`,
        [userId]
      )
    ).rows;

    // Products
    const products = (
      await client.query(
        `INSERT INTO products (user_id, name, description, sku, price, stock, category)
         VALUES
           ($1, 'Web Development', 'Full-stack web application development', 'WEB-001', 45000, 999, 'Services'),
           ($1, 'UI/UX Design', 'Product design and prototyping', 'DES-001', 25000, 999, 'Services'),
           ($1, 'SEO Package', 'Monthly SEO optimization', 'SEO-001', 12000, 999, 'Marketing'),
           ($1, 'Laptop Stand', 'Ergonomic aluminum laptop stand', 'HW-101', 2499, 45, 'Hardware'),
           ($1, 'Wireless Mouse', 'Bluetooth ergonomic mouse', 'HW-102', 1299, 120, 'Hardware'),
           ($1, 'Cloud Hosting', 'Annual cloud hosting plan', 'HOST-01', 18000, 50, 'Software')
         RETURNING id, name, price, stock`,
        [userId]
      )
    ).rows;

    // Invoices
    const invoiceDefs = [
      {
        num: 'INV-0001',
        customer: 0,
        date: daysAgo(45),
        due: daysAgo(15),
        status: 'paid',
        items: [
          { product: 0, qty: 1 },
          { product: 1, qty: 1 },
        ],
        taxRate: 18,
      },
      {
        num: 'INV-0002',
        customer: 1,
        date: daysAgo(30),
        due: daysAgo(0),
        status: 'paid',
        items: [{ product: 2, qty: 2 }],
        taxRate: 18,
      },
      {
        num: 'INV-0003',
        customer: 2,
        date: daysAgo(14),
        due: daysAgo(14 + 30),
        status: 'pending',
        items: [
          { product: 3, qty: 10 },
          { product: 4, qty: 5 },
        ],
        taxRate: 18,
      },
      {
        num: 'INV-0004',
        customer: 3,
        date: daysAgo(7),
        due: daysAgo(7 + 30),
        status: 'pending',
        items: [{ product: 5, qty: 1 }],
        taxRate: 18,
      },
      {
        num: 'INV-0005',
        customer: 0,
        date: daysAgo(3),
        due: daysAgo(3 + 30),
        status: 'overdue',
        items: [{ product: 0, qty: 2 }],
        taxRate: 18,
      },
    ];

    const invoiceIds = [];

    for (const inv of invoiceDefs) {
      let subtotal = 0;
      const lineItems = inv.items.map((item) => {
        const p = products[item.product];
        const total = parseFloat(p.price) * item.qty;
        subtotal += total;
        return {
          name: p.name,
          description: `Professional ${p.name} service`,
          qty: item.qty,
          unitPrice: p.price,
          total,
        };
      });

      const taxAmount = (subtotal * inv.taxRate) / 100;
      const total = subtotal + taxAmount;

      const invResult = await client.query(
        `INSERT INTO invoices (
          user_id, customer_id, invoice_number, invoice_date, due_date,
          subtotal, tax_rate, tax_amount, total, status, payment_method, ai_generated
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [
          userId,
          customers[inv.customer].id,
          inv.num,
          toDateString(inv.date),
          toDateString(inv.due),
          subtotal,
          inv.taxRate,
          taxAmount,
          total,
          inv.status,
          'Bank Transfer',
          true,
        ]
      );
      const invoiceId = invResult.rows[0].id;
      invoiceIds.push({ id: invoiceId, ...inv, total, customerId: customers[inv.customer].id });

      for (const line of lineItems) {
        await client.query(
          `INSERT INTO invoice_items (invoice_id, product_name, description, quantity, unit_price, total)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [invoiceId, line.name, line.description, line.qty, line.unitPrice, line.total]
        );
      }
    }

    // Transactions (from invoices + extras)
    for (const inv of invoiceIds) {
      const payStatus = inv.status === 'paid' ? 'completed' : 'pending';
      await client.query(
        `INSERT INTO transactions (
          user_id, invoice_id, customer_id, transaction_type, amount,
          payment_status, payment_method, category, description, transaction_date
        ) VALUES ($1,$2,$3,'income',$4,$5,$6,'invoice',$7,$8)`,
        [
          userId,
          inv.id,
          inv.customerId,
          inv.total,
          payStatus,
          'Bank Transfer',
          `Invoice ${inv.num}`,
          inv.date,
        ]
      );

      if (inv.status === 'paid') {
        await client.query(
          `INSERT INTO payments (user_id, invoice_id, amount, payment_method, payment_date, status, notes)
           VALUES ($1,$2,$3,'Bank Transfer',$4,'completed',$5)`,
          [userId, inv.id, inv.total, inv.date, `Payment for ${inv.num}`]
        );
      }
    }

    // Extra income transaction
    await client.query(
      `INSERT INTO transactions (
        user_id, customer_id, transaction_type, amount, quantity, remaining_stock,
        payment_status, payment_method, category, description, transaction_date
      ) VALUES ($1,$2,'income',$3,$4,$5,'completed','UPI','sales','Direct product sale - bulk order',$6)`,
      [userId, customers[1].id, 18500, 5, products[3].stock - 5, daysAgo(20)]
    );

    // Expense-type transactions
    const expenseTxns = [
      { amount: 3500, category: 'Utilities', desc: 'Office electricity bill', days: 25, status: 'completed' },
      { amount: 12000, category: 'Salaries', desc: 'Contractor payment', days: 18, status: 'completed' },
    ];
    for (const tx of expenseTxns) {
      await client.query(
        `INSERT INTO transactions (
          user_id, transaction_type, amount, payment_status, payment_method,
          category, description, transaction_date
        ) VALUES ($1,'expense',$2,$3,'Bank Transfer',$4,$5,$6)`,
        [userId, tx.amount, tx.status, tx.category, tx.desc, daysAgo(tx.days)]
      );
    }

    // Expenses table
    const expenseRows = [
      ['Office rent - March', 45000, 'Utilities', 5, 'Cash', 'WeWork Gurugram', 'paid'],
      ['Google Ads campaign', 8500, 'Marketing', 12, 'Credit Card', 'Google India', 'paid'],
      ['Adobe Creative Cloud', 4200, 'Software', 8, 'Debit Card', 'Adobe Systems', 'paid'],
      ['Team lunch', 3200, 'Office Supplies', 2, 'UPI', 'Local Restaurant', 'paid'],
      ['Domain renewal', 1500, 'Software', 15, 'Credit Card', 'GoDaddy', 'pending'],
      ['Cab to client meeting', 850, 'Travel', 1, 'Cash', 'Uber', 'paid'],
      ['Printer cartridges', 2400, 'Office Supplies', 20, 'Debit Card', 'HP Store', 'pending'],
      ['Freelance designer', 15000, 'Services', 10, 'Bank Transfer', 'Design Studio', 'pending'],
      ['Internet broadband', 1800, 'Utilities', 3, 'UPI', 'Airtel', 'paid'],
      ['Conference tickets', 22000, 'Travel', 25, 'Credit Card', 'TechConf India', 'pending'],
    ];

    for (const [desc, amt, cat, dayOffset, method, vendor, status] of expenseRows) {
      await client.query(
        `INSERT INTO expenses (
          user_id, description, amount, category, expense_date,
          payment_method, vendor, status, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          userId,
          desc,
          amt,
          cat,
          toDateString(daysAgo(dayOffset)),
          method,
          vendor,
          status,
          `Seed expense: ${desc}`,
        ]
      );
    }

    // Wallet transactions
    const walletTxns = [
      ['deposit', 50000, 50000, 'Initial wallet funding', 60],
      ['deposit', 75000, 125000, 'Client payment received', 40],
      ['withdrawal', 15000, 110000, 'Vendor payout', 35],
      ['deposit', 15000, 125000, 'Refund adjustment', 10],
    ];

    for (const [type, amount, balanceAfter, desc, days] of walletTxns) {
      await client.query(
        `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, balance_after, description, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [walletId, type, amount, balanceAfter, desc, daysAgo(days)]
      );
    }

    // Settings
    await client.query(
      `INSERT INTO settings (user_id, setting_key, setting_value) VALUES
         ($1, 'invoice_prefix', 'INV'),
         ($1, 'default_payment_terms', '30'),
         ($1, 'company_tagline', 'Smart invoicing powered by AI')
       ON CONFLICT (user_id, setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value`,
      [userId]
    );

    await client.query('UPDATE wallets SET balance = $1 WHERE id = $2', [125000, walletId]);
}

async function seed() {
  const client = await pool.connect();
  const seedAll = process.env.SEED_ALL !== '0';

  try {
    console.log('Starting database seed...');
    await client.query('BEGIN');

    let usersToSeed = (
      await client.query('SELECT id, email FROM users WHERE deleted_at IS NULL ORDER BY created_at')
    ).rows;

    if (usersToSeed.length === 0) {
      const hashed = await hashPassword(SEED_PASSWORD);
      const created = await client.query(
        `INSERT INTO users (
          email, password, full_name, company_name, phone, address, city, state,
          country, zip_code, tax_id, currency, theme, tax_type,
          gst_rate, cgst_rate, sgst_rate, igst_rate, email_notifications
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
        RETURNING id, email`,
        [
          SEED_EMAIL,
          hashed,
          'Nitin Sinha',
          'AI Invoice Solutions Pvt Ltd',
          '+91 98765 43210',
          '42 Tech Park, Sector 18',
          'Gurugram',
          'Haryana',
          'India',
          '122001',
          '29ABCDE1234F1Z5',
          'INR',
          'dark',
          'GST',
          18,
          9,
          9,
          18,
          true,
        ]
      );
      usersToSeed = created.rows;
      console.log(`Created user: ${SEED_EMAIL}`);
    } else if (!seedAll) {
      const demo = usersToSeed.find((u) => u.email === SEED_EMAIL);
      usersToSeed = demo ? [demo] : [usersToSeed[0]];
    }

    console.log(`Seeding ${usersToSeed.length} user(s)...`);

    for (const { id: userId, email } of usersToSeed) {
      await clearUserData(client, userId);
      await seedUserData(client, userId);
      console.log(`  ✓ ${email}`);
    }

    await client.query('COMMIT');

    console.log('\n✅ Seed completed successfully!\n');
    console.log('Demo login (if created):');
    console.log(`  Email:    ${SEED_EMAIL}`);
    console.log(`  Password: ${SEED_PASSWORD}`);
    console.log('\nEach seeded account includes wallet (₹1,25,000), bank accounts,');
    console.log('transactions, expenses, invoices, products, and customers.\n');

    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
