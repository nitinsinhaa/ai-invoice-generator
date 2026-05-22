import pool from '../config/database.js';
import walletRepository from '../repositories/walletRepository.js';
import transactionRepository from '../repositories/transactionRepository.js';

function getDateRange(timeframe) {
  const now = new Date();
  let startDate;
  let endDate = new Date();

  switch (timeframe) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      break;
    case 'weekly':
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'monthly':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startDateOnly: startDate.toISOString().split('T')[0],
    endDateOnly: endDate.toISOString().split('T')[0],
  };
}

class DashboardService {
  async getMonthlyChartData(userId) {
    const query = `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
          date_trunc('month', CURRENT_DATE),
          '1 month'::interval
        )::date AS month_start
      ),
      revenue AS (
        SELECT date_trunc('month', invoice_date)::date AS month_start,
               COALESCE(SUM(total), 0) AS amount
        FROM invoices
        WHERE user_id = $1 AND deleted_at IS NULL AND status = 'paid'
          AND invoice_date >= date_trunc('month', CURRENT_DATE - INTERVAL '5 months')
        GROUP BY 1
      ),
      expenses AS (
        SELECT date_trunc('month', expense_date)::date AS month_start,
               COALESCE(SUM(amount), 0) AS amount
        FROM expenses
        WHERE user_id = $1 AND deleted_at IS NULL
          AND expense_date >= (CURRENT_DATE - INTERVAL '5 months')
        GROUP BY 1
      )
      SELECT to_char(m.month_start, 'Mon') AS month_label,
             COALESCE(r.amount, 0) AS revenue,
             COALESCE(e.amount, 0) AS expenses
      FROM months m
      LEFT JOIN revenue r ON r.month_start = m.month_start
      LEFT JOIN expenses e ON e.month_start = m.month_start
      ORDER BY m.month_start
    `;

    const result = await pool.query(query, [userId]);
    return {
      months: result.rows.map((r) => r.month_label.trim()),
      revenue: result.rows.map((r) => parseFloat(r.revenue)),
      expenses: result.rows.map((r) => parseFloat(r.expenses)),
    };
  }

  async getDashboardStats(userId, timeframe = 'monthly') {
    const { startDate, endDate, startDateOnly, endDateOnly } = getDateRange(timeframe);

    const summaryQuery = `
      SELECT
        COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END), 0) AS total_revenue,
        COALESCE(SUM(CASE WHEN i.status IN ('pending', 'overdue') THEN i.total ELSE 0 END), 0) AS pending_revenue,
        COUNT(*)::int AS total_invoices,
        COUNT(*) FILTER (WHERE i.status = 'paid')::int AS paid_invoices,
        COUNT(*) FILTER (WHERE i.status IN ('pending', 'overdue'))::int AS pending_invoices
      FROM invoices i
      WHERE i.user_id = $1 AND i.deleted_at IS NULL
        AND i.invoice_date >= $2 AND i.invoice_date <= $3
    `;

    const expenseQuery = `
      SELECT category, COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE user_id = $1 AND deleted_at IS NULL
        AND expense_date >= $2 AND expense_date <= $3
      GROUP BY category
    `;

    const [summaryRes, expenseRes, wallet, recentTransactions, monthlyData] =
      await Promise.all([
        pool.query(summaryQuery, [userId, startDate, endDate]),
        pool.query(expenseQuery, [userId, startDateOnly, endDateOnly]),
        walletRepository.findByUserId(userId),
        transactionRepository.findAll(userId, { limit: 10 }),
        this.getMonthlyChartData(userId),
      ]);

    const s = summaryRes.rows[0];
    const totalRevenue = parseFloat(s.total_revenue);
    const totalExpenses = expenseRes.rows.reduce(
      (sum, row) => sum + parseFloat(row.total),
      0
    );

    const expensesByCategory = {};
    expenseRes.rows.forEach((row) => {
      expensesByCategory[row.category || 'Other'] = parseFloat(row.total);
    });

    return {
      summary: {
        totalRevenue,
        pendingRevenue: parseFloat(s.pending_revenue),
        totalExpenses,
        totalInvoices: s.total_invoices,
        paidInvoices: s.paid_invoices,
        pendingInvoices: s.pending_invoices,
        walletBalance: parseFloat(wallet?.balance || 0),
        netProfit: totalRevenue - totalExpenses,
      },
      expensesByCategory,
      recentTransactions,
      monthlyData,
    };
  }

  async getInsightsPayload(userId, timeframe = 'monthly') {
    const stats = await this.getDashboardStats(userId, timeframe);
    return {
      timeframe,
      ...stats.summary,
      expensesByCategory: stats.expensesByCategory,
      pendingInvoices: stats.summary.pendingInvoices,
    };
  }
}

export default new DashboardService();
