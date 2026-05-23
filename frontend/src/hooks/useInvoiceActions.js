import toast from 'react-hot-toast';
import { invoiceApi } from '../api/invoiceApi';

export function useInvoiceActions(fetchInvoices) {
  const handleMarkAsPaid = async (id) => {
    try {
      await invoiceApi.markAsPaid(id);
      toast.success('Invoice marked as paid — revenue recorded in Sales History');
      await fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark invoice as paid');
    }
  };

  const handleInvoiceStatusChange = async (invoice, newStatus, setInvoices) => {
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
    } catch {
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

  return {
    handleMarkAsPaid,
    handleInvoiceStatusChange,
    handleDownload,
    handleSendEmail,
  };
}
