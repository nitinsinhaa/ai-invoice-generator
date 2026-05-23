import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingDown, Receipt, Clock, Sparkles } from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Header from '../components/Header';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import Badge from '../components/Badge';
import { dashboardApi } from '../api/dashboardApi';
import { aiApi } from '../api/aiApi';
import PageInfo from '../components/PageInfo';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';

const EMPTY_STATS = {
  summary: {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    pendingRevenue: 0,
    walletBalance: 0,
  },
  expensesByCategory: {},
  recentTransactions: [],
  monthlyData: { months: [], revenue: [], expenses: [] },
};

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const chartTooltipStyle = {
  backgroundColor: '#111827',
  border: '1px solid #374151',
  borderRadius: '8px',
  color: '#f3f4f6',
};

const ChartEmptyState = ({ message }) => (
  <div className="flex items-center justify-center h-[300px] text-muted text-sm">
    {message}
  </div>
);

const Dashboard = () => {
  const { currency, theme } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('monthly');
  const [insights, setInsights] = useState('');
  const [insightsLoading, setInsightsLoading] = useState(false);

  const isDark = theme === 'dark';
  const axisColor = isDark ? '#9ca3af' : '#6b7280';
  const gridColor = isDark ? '#374151' : '#e5e7eb';

  useEffect(() => {
    fetchDashboardStats();
    fetchInsights();
  }, [timeframe]);

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      const response = await aiApi.businessInsights({ timeframe });
      const data = response.data.data || response.data;
      setInsights(data.insights || '');
    } catch {
      setInsights('');
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getStats({ timeframe });
      const data = response.data.data || response.data;
      setStats(data || EMPTY_STATS);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error('Failed to load dashboard data');
      setStats(EMPTY_STATS);
    } finally {
      setLoading(false);
    }
  };

  const expenseData = useMemo(
    () =>
      Object.entries(stats?.expensesByCategory || {}).map(([name, value]) => ({
        name,
        value: parseFloat(value),
      })),
    [stats?.expensesByCategory]
  );

  const chartData = useMemo(
    () =>
      stats?.monthlyData?.months?.map((month, index) => ({
        month,
        revenue: stats.monthlyData.revenue[index] ?? 0,
        expenses: stats.monthlyData.expenses[index] ?? 0,
      })) ?? [],
    [stats?.monthlyData]
  );

  const hasChartData = chartData.some((d) => d.revenue > 0 || d.expenses > 0);
  const hasExpenseBreakdown = expenseData.length > 0 && expenseData.some((d) => d.value > 0);

  if (loading) return <LoadingSpinner />;

  const summary = stats?.summary ?? EMPTY_STATS.summary;

  return (
    <div>
      <Header title="Dashboard" />

      <ErrorBoundary>
      <div className="p-8">

        {(insights || insightsLoading) && (
          <div className="card mb-6 border-primary-200 dark:border-primary-900/50">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-semibold text-heading">AI Business Insights</h3>
            </div>
            {insightsLoading ? (
              <p className="text-sm text-muted">Analyzing your numbers…</p>
            ) : (
              <div className="text-sm text-muted whitespace-pre-line leading-relaxed">{insights}</div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-heading">Overview</h2>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="input-field w-auto min-w-[140px]"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Revenue (Paid)"
            value={formatCurrency(summary.totalRevenue, currency)}
            icon={DollarSign}
            color="green"
          />
          {summary.pendingRevenue > 0 && (
            <StatCard
              title="Awaiting Payment"
              value={formatCurrency(summary.pendingRevenue, currency)}
              icon={Clock}
              color="yellow"
            />
          )}
          <StatCard
            title="Total Expenses"
            value={formatCurrency(summary.totalExpenses, currency)}
            icon={TrendingDown}
            color="red"
          />
          <StatCard
            title="Total Invoices"
            value={summary.totalInvoices}
            icon={Receipt}
            color="blue"
          />
          <StatCard
            title="Pending Invoices"
            value={summary.pendingInvoices}
            icon={Clock}
            color="yellow"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-heading mb-4">Revenue vs Expenses</h3>
            {hasChartData ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" stroke={axisColor} tick={{ fill: axisColor }} />
                  <YAxis stroke={axisColor} tick={{ fill: axisColor }} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend wrapperStyle={{ color: isDark ? '#e5e7eb' : '#374151' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message="No revenue or expense data for this period." />
            )}
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-heading mb-4">Expense Breakdown</h3>
            {hasExpenseBreakdown ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => formatCurrency(value, currency)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ChartEmptyState message="No expenses recorded for this period." />
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-heading mb-4">Recent Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="table-head-cell">Date</th>
                  <th className="table-head-cell">Description</th>
                  <th className="table-head-cell">Type</th>
                  <th className="table-head-cell">Amount</th>
                  <th className="table-head-cell">Status</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {stats?.recentTransactions?.length > 0 ? (
                  stats.recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="table-row">
                      <td className="table-cell">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="table-cell">
                        {transaction.description ||
                          transaction.product_name ||
                          transaction.invoice_number ||
                          '—'}
                      </td>
                      <td className="table-cell">
                        <Badge status={transaction.transaction_type} text={transaction.transaction_type} />
                      </td>
                      <td className="table-cell font-medium">
                        {formatCurrency(transaction.amount, currency)}
                      </td>
                      <td className="table-cell">
                        <Badge status={transaction.payment_status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-muted">
                      No recent transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </ErrorBoundary>
    </div>
  );
};

export default Dashboard;
