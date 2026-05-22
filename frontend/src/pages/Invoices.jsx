import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Download, Mail, Trash2, Sparkles, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import PageInfo from '../components/PageInfo';
import Table from '../components/Table';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { useInventory } from '../context/InventoryContext';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/currency';
import { invoiceApi } from '../api/invoiceApi';
import { aiApi } from '../api/aiApi';
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

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
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
  };

  const calculateTotals = (items, taxRate, discountRate) => {
    const subtotal = items.reduce((sum, item) => sum + parseFloat(item.total || 0), 0);
    const taxAmount = (subtotal * parseFloat(taxRate || 0)) / 100;
    const discountAmount = (subtotal * parseFloat(discountRate || 0)) / 100;
    const total = subtotal + taxAmount - discountAmount;

    return {
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      total,
    };
  };

  const totals = useMemo(
    () => calculateTotals(formData.items, formData.tax_rate, formData.discount_rate),
    [formData.items, formData.tax_rate, formData.discount_rate]
  );

  const extractAiData = (response) => response.data?.data ?? response.data ?? {};

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;

    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }

    const totals = calculateTotals(newItems, formData.tax_rate, formData.discount_rate);
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
    const totals = calculateTotals(newItems, formData.tax_rate, formData.discount_rate);
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
    const totals = calculateTotals(formData.items, formData.tax_rate, formData.discount_rate);
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
      fetchProducts();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    }
  };

  const handleMarkAsPaid = async (id) => {
    try {
      await invoiceApi.markAsPaid(id);
      toast.success('Invoice marked as paid — revenue recorded in Sales History');
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark invoice as paid');
    }
  };

  const handleInvoiceStatusChange = async (invoice, newStatus) => {
    if (invoice.status === newStatus) return;

    const previousStatus = invoice.status;
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === invoice.id ? { ...inv, status: newStatus } : inv))
    );

    try {
      if (newStatus === 'paid') {
        await invoiceApi.markAsPaid(invoice.id);
        toast.success('Invoice marked as paid');
      } else {
        await invoiceApi.updateInvoice(invoice.id, { status: newStatus });
        toast.success(`Payment status updated to ${newStatus}`);
      }
      await fetchInvoices();
    } catch (error) {
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoice.id ? { ...inv, status: previousStatus } : inv))
      );
      toast.error(error.response?.data?.message || error.message || 'Failed to update payment status');
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

  const handleDownload = async (id) => {
    try {
      const response = await invoiceApi.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Invoice downloaded!');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleSendEmail = async (id) => {
    try {
      const response = await invoiceApi.sendInvoice(id, {});
      const data = response.data?.data;
      if (data?.previewUrl) {
        toast.success('Invoice sent (dev mode — opening preview)');
        window.open(data.previewUrl, '_blank');
      } else {
        toast.success(response.data?.message || 'Invoice sent via email!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invoice email');
    }
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
            handleInvoiceStatusChange(row, e.target.value);
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

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Items</h3>
              <button type="button" onClick={addItem} className="btn-secondary text-sm">
                Add Item
              </button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 mb-3 items-start">
                <div className="col-span-3">
                  <select
                    className="input-field"
                    value={item.product_id || ''}
                    onChange={(e) => {
                      const productId = e.target.value;
                      if (productId) {
                        const availableProducts = getAvailableProducts();
                        const product = availableProducts.find(p => p.id === productId);
                        if (product) {
                          handleItemChange(index, 'product_id', productId);
                          handleItemChange(index, 'product_name', product.name);
                          handleItemChange(index, 'description', product.description);
                          handleItemChange(index, 'unit_price', product.price);
                        }
                      } else {
                        handleItemChange(index, 'product_id', '');
                        handleItemChange(index, 'product_name', '');
                      }
                    }}
                  >
                    <option value="">Select product...</option>
                    {getAvailableProducts().map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {formatCurrency(product.price, currency)} (Stock: {product.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3 relative">
                  <input
                    type="text"
                    placeholder="Description"
                    className="input-field pr-10"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => handleAIDescription(index)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    title="Generate with AI"
                  >
                    <Sparkles className="w-4 h-4 text-primary-600" />
                  </button>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Qty"
                    className="input-field"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    placeholder="Price"
                    className="input-field"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-1">
                  <input
                    type="text"
                    className="input-field"
                    value={formatCurrency(item.total, 'INR')}
                    readOnly
                  />
                </div>
                <div className="col-span-1">
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-heading mb-2">Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={formData.tax_rate}
                onChange={(e) => {
                  const next = calculateTotals(formData.items, e.target.value, formData.discount_rate);
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
                  const totals = calculateTotals(formData.items, formData.tax_rate, e.target.value);
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
  );
};

export default Invoices;
