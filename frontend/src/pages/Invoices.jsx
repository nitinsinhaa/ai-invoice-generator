import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Download, Mail, Sparkles, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import Table from '../components/Table';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorBoundary from '../components/ErrorBoundary';
import InvoiceLineItems from '../components/InvoiceLineItems';
import { useInventory } from '../context/InventoryContext';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';
import { invoiceApi } from '../api/invoiceApi';
import { aiApi } from '../api/aiApi';
import { calculateInvoiceTotals, useInvoiceCalculations } from '../hooks/useInvoiceCalculations';
import { useInvoiceActions } from '../hooks/useInvoiceActions';
import toast from 'react-hot-toast';

const Invoices = () => {
  const { getAvailableProducts, updateStock } = useInventory();
  const { currency } = useApp();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer: { name: '', email: '', phone: '', address: '' },
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    items: [{ product_id: '', product_name: '', description: '', quantity: 1, unit_price: 0, total: 0 }],
    subtotal: 0,
    tax_rate: 0,
    tax_amount: 0,
    discount_rate: 0,
    discount_amount: 0,
    total: 0,
    notes: '',
    status: 'pending',
  });

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await invoiceApi.getInvoices();
      const data = response.data.data || response.data;
      setInvoices(data.items || data.invoices || data || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error('Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const totals = useInvoiceCalculations(formData.items, formData.tax_rate, formData.discount_rate);
  const { handleMarkAsPaid, handleInvoiceStatusChange, handleDownload, handleSendEmail } =
    useInvoiceActions(fetchInvoices);

  const extractAiData = (response) => response.data?.data ?? response.data ?? {};

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }

    const totals = calculateInvoiceTotals(newItems, formData.tax_rate, formData.discount_rate);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_name: '', description: '', quantity: 1, unit_price: 0, total: 0 }],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateInvoiceTotals(newItems, formData.tax_rate, formData.discount_rate);
    setFormData({ ...formData, items: newItems, ...totals });
  };

  const handleAIDescription = async (index) => {
    try {
      const productName = formData.items[index].product_name;
      if (!productName) {
        toast.error('Enter product name first');
        return;
      }

      const response = await aiApi.generateDescription({ productName });
      const { description, usedFallback } = extractAiData(response);
      if (!description) throw new Error('No description returned');
      handleItemChange(index, 'description', description);
      toast.success(
        usedFallback
          ? 'Description applied (AI quota limited — using template)'
          : 'AI description generated!'
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate description. Check GEMINI_API_KEY in backend .env');
    }
  };

  const handleAISuggestNotes = async () => {
    if (!formData.customer.name?.trim()) {
      toast.error('Enter customer name first');
      return;
    }
    try {
      setNotesLoading(true);
      const response = await aiApi.generateInvoiceNotes({
        customerName: formData.customer.name,
        items: formData.items,
        subtotal: totals.subtotal,
        taxRate: formData.tax_rate,
        total: totals.total,
        dueDate: formData.due_date,
      });
      const { notes, usedFallback } = extractAiData(response);
      if (!notes) throw new Error('No notes returned');
      setFormData({ ...formData, notes });
      toast.success(
        usedFallback
          ? 'Notes applied (AI quota limited — using template)'
          : 'AI suggested notes applied'
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate notes. Check GEMINI_API_KEY in backend .env');
    } finally {
      setNotesLoading(false);
    }
  };

  const buildPayload = () => {
    const totals = calculateInvoiceTotals(formData.items, formData.tax_rate, formData.discount_rate);
    return {
      customer: formData.customer,
      invoice_date: formData.invoice_date,
      due_date: formData.due_date,
      items: formData.items,
      subtotal: totals.subtotal,
      tax_rate: parseFloat(formData.tax_rate) || 0,
      tax_amount: totals.tax_amount,
      discount_rate: parseFloat(formData.discount_rate) || 0,
      discount_amount: totals.discount_amount,
      total: totals.total,
      notes: formData.notes,
      status: formData.status,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await invoiceApi.createInvoice(buildPayload());
      toast.success(
        formData.status === 'paid'
          ? 'Invoice created and recorded as paid!'
          : 'Invoice created! Stock updated. Mark as paid when you receive payment.'
      );
      setShowModal(false);
      fetchInvoices();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    }
  };

  const resetForm = () => {
    setFormData({
      customer: { name: '', email: '', phone: '', address: '' },
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      items: [{ product_id: '', product_name: '', description: '', quantity: 1, unit_price: 0, total: 0 }],
      subtotal: 0,
      tax_rate: 0,
      tax_amount: 0,
      discount_rate: 0,
      discount_amount: 0,
      total: 0,
      notes: '',
      status: 'pending',
    });
  };

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoice_number',
    },
    {
      header: 'Customer',
      accessor: 'customer_name',
    },
    {
      header: 'Date',
      accessor: 'invoice_date',
      render: (row) => new Date(row.invoice_date).toLocaleDateString(),
    },
    {
      header: 'Due Date',
      accessor: 'due_date',
      render: (row) => new Date(row.due_date).toLocaleDateString(),
    },
    {
      header: 'Amount',
      accessor: 'total',
      render: (row) => formatCurrency(row.total, 'INR'),
    },
    {
      header: 'Payment Status',
      accessor: 'status',
      render: (row) => (
        <select
          className="input-field py-1.5 text-sm min-w-[120px]"
          value={row.status}
          disabled={row.status === 'paid'}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            handleInvoiceStatusChange(row, e.target.value, setInvoices);
          }}
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.status !== 'paid' && row.status !== 'cancelled' && (
            <button
              onClick={() => handleMarkAsPaid(row.id)}
              className="p-2 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-lg"
              title="Quick mark as paid"
            >
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            </button>
          )}
          <button
            onClick={() => handleDownload(row.id)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Download"
          >
            <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => handleSendEmail(row.id)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title="Send Email"
          >
            <Mail className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ErrorBoundary>
    <div>
      <Header title="Invoices" />

      <div className="p-8">

        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoices..."
              className="input-field pl-10"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Invoice
          </button>
        </div>

        <div className="card">
          {loading ? <LoadingSpinner /> : <Table columns={columns} data={invoices} />}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Invoice"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.customer.name}
                onChange={(e) => setFormData({ ...formData, customer: { ...formData.customer, name: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
              <input
                type="email"
                required
                className="input-field"
                value={formData.customer.email}
                onChange={(e) => setFormData({ ...formData, customer: { ...formData.customer, email: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date</label>
              <input
                type="date"
                required
                className="input-field"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-heading mb-2">Due Date</label>
              <input
                type="date"
                required
                className="input-field"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-heading mb-2">Status</label>
              <select
                className="input-field"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="pending">Pending (awaiting payment)</option>
                <option value="paid">Paid (record revenue now)</option>
              </select>
            </div>
          </div>

          <InvoiceLineItems
            items={formData.items}
            onItemChange={handleItemChange}
            onAdd={addItem}
            onRemove={removeItem}
            onAIDescription={handleAIDescription}
            availableProducts={getAvailableProducts()}
            currency={currency}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-heading mb-2">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={formData.tax_rate}
                onChange={(e) => {
                  const next = calculateInvoiceTotals(formData.items, e.target.value, formData.discount_rate);
                  setFormData({ ...formData, tax_rate: e.target.value, ...next });
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-heading mb-2">Discount Rate (%)</label>
              <input
                type="number"
                className="input-field"
                value={formData.discount_rate}
                onChange={(e) => {
                  const totals = calculateInvoiceTotals(formData.items, formData.tax_rate, e.target.value);
                  setFormData({ ...formData, discount_rate: e.target.value, ...totals });
                }}
              />
            </div>
          </div>

          <div className="invoice-totals-box">
            <div className="flex justify-between">
              <span className="invoice-totals-label">Subtotal:</span>
              <span className="invoice-totals-value">{formatCurrency(totals.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="invoice-totals-label">Tax ({formData.tax_rate || 0}%):</span>
              <span className="invoice-totals-value">{formatCurrency(totals.tax_amount, currency)}</span>
            </div>
            <div className="flex justify-between">
              <span className="invoice-totals-label">Discount ({formData.discount_rate || 0}%):</span>
              <span className="invoice-totals-value">-{formatCurrency(totals.discount_amount, currency)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 dark:border-gray-600 pt-2 mt-1">
              <span className="invoice-totals-total-label">Total:</span>
              <span className="invoice-totals-total-value">{formatCurrency(totals.total, currency)}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-heading">Notes</label>
              <button
                type="button"
                onClick={handleAISuggestNotes}
                disabled={notesLoading}
                className="btn-secondary flex items-center gap-1 text-sm py-1.5 px-3"
              >
                <Sparkles className="w-4 h-4" />
                {notesLoading ? 'Suggesting…' : 'AI Suggested'}
              </button>
            </div>
            <textarea
              className="input-field"
              rows="3"
              placeholder="Payment terms, thank-you message, or other notes…"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1">
              Create Invoice
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
    </ErrorBoundary>
  );
};

export default Invoices;
