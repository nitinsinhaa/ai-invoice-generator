import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PDFGenerator {
  async generateInvoicePDF(invoice, user) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const fileName = `invoice-${invoice.invoice_number}.pdf`;
        const filePath = path.join(__dirname, '../../uploads', fileName);

        if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
          fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(24).text('INVOICE', 50, 50, { align: 'left' });

        doc.fontSize(10)
           .text(user.company_name || user.full_name, 50, 90)
           .text(user.email, 50, 105)
           .text(user.phone || '', 50, 120)
           .text(user.address || '', 50, 135);

        doc.fontSize(10)
           .text('Bill To:', 350, 90)
           .text(invoice.customer_name || '', 350, 105)
           .text(invoice.customer_email || '', 350, 120)
           .text(invoice.customer_phone || '', 350, 135)
           .text(invoice.customer_address || '', 350, 150);

        doc.fontSize(10)
           .text(`Invoice #: ${invoice.invoice_number}`, 50, 200)
           .text(`Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 50, 215)
           .text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, 50, 230)
           .text(`Status: ${invoice.status.toUpperCase()}`, 50, 245);

        const tableTop = 290;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Item', 50, tableTop);
        doc.text('Qty', 250, tableTop);
        doc.text('Price', 320, tableTop);
        doc.text('Total', 450, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        doc.font('Helvetica');
        let yPosition = tableTop + 25;

        if (invoice.items && invoice.items.length > 0) {
          invoice.items.forEach((item) => {
            doc.text(item.product_name, 50, yPosition, { width: 180 });
            if (item.description) {
              doc.fontSize(8).text(item.description, 50, yPosition + 12, { width: 180 });
              doc.fontSize(10);
            }
            doc.text(item.quantity.toString(), 250, yPosition);
            doc.text(`$${parseFloat(item.unit_price).toFixed(2)}`, 320, yPosition);
            doc.text(`$${parseFloat(item.total).toFixed(2)}`, 450, yPosition);
            yPosition += 40;
          });
        }

        yPosition += 20;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

        yPosition += 15;
        doc.text('Subtotal:', 350, yPosition);
        doc.text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, 450, yPosition);

        yPosition += 20;
        if (invoice.discount_amount > 0) {
          doc.text(`Discount (${invoice.discount_rate}%):`, 350, yPosition);
          doc.text(`-$${parseFloat(invoice.discount_amount).toFixed(2)}`, 450, yPosition);
          yPosition += 20;
        }

        if (invoice.tax_amount > 0) {
          doc.text(`Tax (${invoice.tax_rate}%):`, 350, yPosition);
          doc.text(`$${parseFloat(invoice.tax_amount).toFixed(2)}`, 450, yPosition);
          yPosition += 20;
        }

        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Total:', 350, yPosition);
        doc.text(`$${parseFloat(invoice.total).toFixed(2)}`, 450, yPosition);

        if (invoice.notes) {
          yPosition += 50;
          doc.font('Helvetica').fontSize(10);
          doc.text('Notes:', 50, yPosition);
          doc.text(invoice.notes, 50, yPosition + 15, { width: 500 });
        }

        doc.fontSize(8).text(
          'Thank you for your business!',
          50,
          700,
          { align: 'center', width: 500 }
        );

        doc.end();

        stream.on('finish', () => {
          resolve({ filePath, fileName });
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new PDFGenerator();
