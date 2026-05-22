import { useState, useEffect, useCallback } from 'react';
import { Search, Download } from 'lucide-react';
import Header from '../components/Header';
import PageInfo from '../components/PageInfo';
import Table from '../components/Table';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import { transactionApi } from '../api/transactionApi';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';

const Transactions = () => {
  const { currency } = useApp();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    page: 1,
    limit: 20,
  });

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;

      const response = await transactionApi.getTransactions(params);
      const data = response.data.data || response.data;

      setTransactions(data.transactions || []);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.limit, filters.search, filters.type, filters.status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions();
    }, filters.search ? 300 : 0);

    return () => clearTimeout(timer);
  }, [fetchTransactions, filters.search]);

  const columns = [
    {
      header: 'Date',
      accessor: 'transaction_date',
      render: (row) => new Date(row.transaction_date).toLocaleDateString(),
    },
    {
      header: 'Product/Service',
      accessor: 'product_name',
      render: (row) =>
        row.product_name || row.description || row.invoice_number || '—',
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
      render: (row) => row.customer_name || '—',
    },
    {
      header: 'Type',
      accessor: 'transaction_type',
      render: (row) => (
        <Badge
          status={row.transaction_type}
          text={row.transaction_type === 'income' ? 'Income' : 'Expense'}
        />
      ),
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => (
        <span
          className={
            row.transaction_type === 'income'
              ? 'text-green-600 dark:text-green-400 font-medium'
              : 'text-red-600 dark:text-red-400 font-medium'
          }
        >
          {formatCurrency(row.amount, currency)}
        </span>
      ),
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      render: (row) => (row.quantity != null ? row.quantity : '—'),
    },
    {
      header: 'Stock',
      accessor: 'remaining_stock',
      render: (row) => (row.remaining_stock != null ? row.remaining_stock : '—'),
    },
    {
      header: 'Status',
      accessor: 'payment_status',
      render: (row) => <Badge status={row.payment_status} />,
    },
  ];

  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  return (
    <div>
      <Header title="Sales History" />

      <div className="p-8">

        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sales..."
                className="input-field pl-10"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value, page: 1 })
                }
              />
            </div>

            <select
              className="input-field w-auto min-w-[140px]"
              value={filters.type}
              onChange={(e) =>
                setFilters({ ...filters, type: e.target.value, page: 1 })
              }
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            <select
              className="input-field w-auto min-w-[140px]"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value, page: 1 })
              }
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
            </select>

            <button
              type="button"
              className="btn-secondary flex items-center gap-2"
              onClick={() => toast('Export coming soon')}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted">
              {total === 0
                ? 'No transactions found'
                : `Showing ${transactions.length} of ${total} transaction${total !== 1 ? 's' : ''}`}
            </p>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <Table columns={columns} data={transactions} />
          )}

          {total > filters.limit && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                className="btn-secondary"
                disabled={filters.page <= 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
              >
                Previous
              </button>
              <span className="text-sm text-muted">
                Page {filters.page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-secondary"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
