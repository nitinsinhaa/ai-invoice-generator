import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sanitizeText = (text, maxLength = 100) => {
  if (!text) return '';
  return String(text)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
};

const checkAndAddPage = (doc, state, neededSpace = 40) => {
  const pageHeight = doc.page.height;
  if (state.currentY + neededSpace > pageHeight - state.margin) {
    doc.addPage();
    state.currentY = state.margin;
  }
};

class PDFGenerator {
  async generateInvoicePDF(invoice, user) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const safeNumber = sanitizeText(invoice.invoice_number, 20);
        const fileName = `invoice-${safeNumber}.pdf`;
        const filePath = path.join(__dirname, '../../uploads', fileName);

        if (!fs.existsSync(path.join(__dirname, '../../uploads'))) {
          fs.mkdirSync(path.join(__dirname, '../../uploads'), { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const state = { currentY: 50, margin: 50, lineHeight: 18 };

        doc.fontSize(24).text('INVOICE', state.margin, state.currentY);
        state.currentY += 40;

        doc.fontSize(10).font('Helvetica');
        doc.text(sanitizeText(user.company_name || user.full_name, 60), state.margin, state.currentY);
        state.currentY += state.lineHeight;
        doc.text(sanitizeText(user.email, 80), state.margin, state.currentY);
        state.currentY += state.lineHeight;
        if (user.phone) {
          doc.text(sanitizeText(user.phone, 30), state.margin, state.currentY);
          state.currentY += state.lineHeight;
        }
        if (user.address) {
          doc.text(sanitizeText(user.address, 120), state.margin, state.currentY, { width: 220 });
          state.currentY += state.lineHeight * 2;
        }

        const billToX = 320;
        let billY = 90;
        doc.text('Bill To:', billToX, billY);
        billY += state.lineHeight;
        doc.text(sanitizeText(invoice.customer_name, 60), billToX, billY);
        billY += state.lineHeight;
        doc.text(sanitizeText(invoice.customer_email, 80), billToX, billY);
        billY += state.lineHeight;
        if (invoice.customer_phone) {
          doc.text(sanitizeText(invoice.customer_phone, 30), billToX, billY);
          billY += state.lineHeight;
        }
        if (invoice.customer_address) {
          doc.text(sanitizeText(invoice.customer_address, 120), billToX, billY, { width: 200 });
        }

        state.currentY = Math.max(state.currentY, billY + 30);

        doc.text(`Invoice #: ${safeNumber}`, state.margin, state.currentY);
        state.currentY += state.lineHeight;
        doc.text(
          `Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`,
          state.margin,
          state.currentY
        );
        state.currentY += state.lineHeight;
        doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString()}`, state.margin, state.currentY);
        state.currentY += state.lineHeight;
        doc.text(`Status: ${sanitizeText(invoice.status, 20).toUpperCase()}`, state.margin, state.currentY);
        state.currentY += 30;

        checkAndAddPage(doc, state, 60);
        doc.font('Helvetica-Bold');
        doc.text('Item', state.margin, state.currentY);
        doc.text('Qty', 250, state.currentY);
        doc.text('Price', 320, state.currentY);
        doc.text('Total', 450, state.currentY);
        state.currentY += state.lineHeight;
        doc.moveTo(state.margin, state.currentY).lineTo(550, state.currentY).stroke();
        state.currentY += 10;

        doc.font('Helvetica');
        if (invoice.items && invoice.items.length > 0) {
          for (const item of invoice.items) {
            checkAndAddPage(doc, state, 50);
            const productName = sanitizeText(item.product_name, 80);
            doc.text(productName, state.margin, state.currentY, { width: 180 });
            let rowY = state.currentY;
            if (item.description) {
              doc.fontSize(8).text(sanitizeText(item.description, 150), state.margin, state.currentY + 12, {
                width: 180,
              });
              doc.fontSize(10);
              rowY += 14;
            }
            doc.text(String(item.quantity), 250, state.currentY);
            doc.text(`$${parseFloat(item.unit_price).toFixed(2)}`, 320, state.currentY);
            doc.text(`$${parseFloat(item.total).toFixed(2)}`, 450, state.currentY);
            state.currentY = Math.max(rowY, state.currentY) + 28;
          }
        }

        state.currentY += 10;
        checkAndAddPage(doc, state, 80);
        doc.moveTo(state.margin, state.currentY).lineTo(550, state.currentY).stroke();
        state.currentY += 15;

        doc.text('Subtotal:', 350, state.currentY);
        doc.text(`$${parseFloat(invoice.subtotal).toFixed(2)}`, 450, state.currentY);
        state.currentY += state.lineHeight;

        if (invoice.discount_amount > 0) {
          doc.text(`Discount (${invoice.discount_rate}%):`, 350, state.currentY);
          doc.text(`-$${parseFloat(invoice.discount_amount).toFixed(2)}`, 450, state.currentY);
          state.currentY += state.lineHeight;
        }

        if (invoice.tax_amount > 0) {
          doc.text(`Tax (${invoice.tax_rate}%):`, 350, state.currentY);
          doc.text(`$${parseFloat(invoice.tax_amount).toFixed(2)}`, 450, state.currentY);
          state.currentY += state.lineHeight;
        }

        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Total:', 350, state.currentY);
        doc.text(`$${parseFloat(invoice.total).toFixed(2)}`, 450, state.currentY);
        state.currentY += 30;

        if (invoice.notes) {
          checkAndAddPage(doc, state, 60);
          doc.font('Helvetica').fontSize(10);
          doc.text('Notes:', state.margin, state.currentY);
          state.currentY += state.lineHeight;
          doc.text(sanitizeText(invoice.notes, 500), state.margin, state.currentY, { width: 500 });
          state.currentY += 40;
        }

        checkAndAddPage(doc, state, 30);
        const footerY = Math.max(state.currentY + 20, doc.page.height - state.margin - 30);
        doc.fontSize(8).text('Thank you for your business!', state.margin, footerY, {
          align: 'center',
          width: 500,
        });

        doc.end();

        stream.on('finish', () => resolve({ filePath, fileName }));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}

export default new PDFGenerator();
