import { useState } from 'react';
import { Plus, Search, Download, Calendar, TrendingDown, CheckCircle, Clock, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import PageInfo from '../components/PageInfo';
import { aiApi } from '../api/aiApi';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import Table from '../components/Table';
import Badge from '../components/Badge';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import { useApp } from '../context/AppContext';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/currency';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Office Supplies',
  'Travel',
  'Marketing',
  'Utilities',
  'Salaries',
  'Equipment',
  'Software',
  'Services',
  'Other',
];

const Expenses = () => {
  const { currency } = useApp();
  const { expenses, summary, loading, addExpense, updateExpense, getTotalExpenses } = useExpense();
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
  });
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Office Supplies',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    vendor: '',
    notes: '',
    status: 'pending',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addExpense({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      toast.success('Expense added successfully!');
      setShowModal(false);
      resetForm();
    } catch {
      toast.error('Failed to add expense');
    }
  };

  const extractAiData = (response) => response.data?.data ?? response.data ?? {};

  const handleAICategorize = async () => {
    if (!formData.description.trim()) {
      toast.error('Enter a description first');
      return;
    }
    try {
      const response = await aiApi.categorizeExpense({
        description: formData.description,
        amount: parseFloat(formData.amount) || 0,
      });
      const { category, usedFallback, source, reason } = extractAiData(response);
      if (!category) {
        toast.error('No category returned');
        return;
      }
      const matched = CATEGORIES.includes(category) ? category : 'Other';
      setFormData({ ...formData, category: matched });
      if (usedFallback || source === 'keywords') {
        toast.success(`${matched} (${reason || 'keyword match'})`);
      } else {
        toast.success(`AI suggested: ${matched}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to categorize expense');
    }
  };

  const handleExpenseStatusChange = async (id, status) => {
    try {
      await updateExpense(id, { status });
      toast.success(`Payment status updated to ${status}`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update payment status');
    }
  };

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      category: 'Office Supplies',
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash',
      vendor: '',
      notes: '',
      status: 'pending',
    });
  };

  const filteredExpenses = expenses.filter((expense) => {
    const search = filters.search.toLowerCase();
    const matchesSearch =
      !search ||
      expense.description.toLowerCase().includes(search) ||
      (expense.vendor && expense.vendor.toLowerCase().includes(search));
    const matchesCategory = !filters.category || expense.category === filters.category;
    const matchesStatus = !filters.status || expense.status === filters.status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const columns = [
    {
      header: 'Date',
      accessor: 'expense_date',
      render: (row) => new Date(row.expense_date).toLocaleDateString(),
    },
    {
      header: 'Description',
      accessor: 'description',
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => <span className="category-pill">{row.category}</span>,
    },
    {
      header: 'Vendor',
      accessor: 'vendor',
      render: (row) => row.vendor || '—',
    },
    {
      header: 'Payment Method',
      accessor: 'payment_method',
      render: (row) => <span className="text-muted">{row.payment_method || '—'}</span>,
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (row) => (
        <span className="font-medium text-red-600 dark:text-red-400">
          {formatCurrency(row.amount, currency)}
        </span>
      ),
    },
    {
      header: 'Payment Status',
      accessor: 'status',
      render: (row) => (
        <select
          className="input-field py-1.5 text-sm min-w-[110px]"
          value={row.status || 'pending'}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            handleExpenseStatusChange(row.id, e.target.value);
          }}
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
        </select>
      ),
    },
  ];

  if (loading && expenses.length === 0) {
    return (
      <div>
        <Header title="Expenses" />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div>
      <Header title="Expenses" />

      <ErrorBoundary>
      <div className="p-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total Expenses"
            value={formatCurrency(getTotalExpenses(), currency)}
            icon={TrendingDown}
            color="red"
          />
          <StatCard
            title="This Month"
            value={formatCurrency(summary?.thisMonth ?? 0, currency)}
            icon={Calendar}
            color="yellow"
          />
          <StatCard
            title="Paid"
            value={summary?.paidCount ?? expenses.filter((e) => e.status === 'paid').length}
            icon={CheckCircle}
            color="green"
          />
          <StatCard
            title="Pending"
            value={summary?.pendingCount ?? expenses.filter((e) => e.status === 'pending').length}
            icon={Clock}
            color="yellow"
          />
        </div>

        <div className="card mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search expenses..."
                className="input-field pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>

            <select
              className="input-field w-auto min-w-[160px]"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="input-field w-auto min-w-[140px]"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>

            <button
              type="button"
              className="btn-secondary flex items-center gap-2 whitespace-nowrap"
              onClick={() => toast('Export coming soon')}
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              Add Expense
            </button>
          </div>
        </div>

        <div className="card">
          <p className="text-sm text-muted mb-4">
            {filteredExpenses.length === 0
              ? 'No expenses found'
              : `${filteredExpenses.length} expense${filteredExpenses.length !== 1 ? 's' : ''}`}
          </p>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="empty-state-icon" />
              <p className="text-muted">
                No expenses found. Click &quot;Add Expense&quot; to get started!
              </p>
            </div>
          ) : (
            <Table columns={columns} data={filteredExpenses} />
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title="Add New Expense"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-heading mb-2">Description</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  className="input-field flex-1"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <button
                  type="button"
                  onClick={handleAICategorize}
                  className="btn-secondary flex items-center gap-1 whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  AI Category
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-heading mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                required
                className="input-field"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-heading mb-2">Date</label>
              <input
                type="date"
                required
                className="input-field"
                value={formData.expense_date}
                onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-heading mb-2">Category</label>
              <select
                className="input-field"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-heading mb-2">Payment Method</label>
              <select
                className="input-field"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-heading mb-2">Payment Status</label>
              <select
                className="input-field"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-heading mb-2">Vendor</label>
              <input
                type="text"
                className="input-field"
                value={formData.vendor}
                onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-heading mb-2">Notes</label>
              <textarea
                className="input-field"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              Add Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
      </ErrorBoundary>
    </div>
  );
};

export default Expenses;
