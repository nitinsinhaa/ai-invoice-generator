import nodemailer from 'nodemailer';
import config from '../config/env.js';

const PLACEHOLDER_VALUES = [
  'your_email@gmail.com',
  'your_email_password',
  'your_email_app_password',
  'changeme',
];

function isPlaceholder(value) {
  if (!value || typeof value !== 'string') return true;
  const v = value.trim().toLowerCase();
  return !v || PLACEHOLDER_VALUES.some((p) => v.includes(p));
}

class EmailService {
  constructor() {
    this._transporter = null;
    this._usingEthereal = false;
    this._etherealReady = false;
  }

  isConfigured() {
    return !isPlaceholder(config.email.user) && !isPlaceholder(config.email.password);
  }

  async getTransporter() {
    if (this._transporter) return this._transporter;

    if (this.isConfigured()) {
      this._transporter = nodemailer.createTransport({
        host: config.email.host,
        port: Number(config.email.port) || 587,
        secure: Number(config.email.port) === 465,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
      });
      return this._transporter;
    }

    if (config.nodeEnv === 'development') {
      const testAccount = await nodemailer.createTestAccount();
      this._transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      this._usingEthereal = true;
      this._etherealReady = true;
      console.log('[Email] Development mode: using Ethereal test SMTP');
      console.log(`[Email] Test inbox user: ${testAccount.user}`);
      return this._transporter;
    }

    return null;
  }

  async verifyConnection() {
    const transporter = await this.getTransporter();
    if (!transporter) {
      return { ok: false, mode: 'disabled', message: 'Email not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env' };
    }
    await transporter.verify();
    return {
      ok: true,
      mode: this._usingEthereal ? 'ethereal' : 'smtp',
      message: this._usingEthereal
        ? 'Using Ethereal test mail (preview links in server logs)'
        : `Connected to ${config.email.host}`,
    };
  }

  formatMoney(amount, currency = 'INR') {
    const n = parseFloat(amount) || 0;
    if (currency === 'INR') return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    return `$${n.toFixed(2)}`;
  }

  baseTemplate(title, bodyHtml) {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #22c55e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 24px; background-color: #f9fafb; border: 1px solid #e5e7eb; }
    .box { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1 style="margin:0;font-size:20px;">${title}</h1></div>
    <div class="content">${bodyHtml}</div>
    <div class="footer">AI Invoice Generator — automated notification</div>
  </div>
</body>
</html>`;
  }

  async sendMail({ to, subject, html, attachments = [] }) {
    const transporter = await this.getTransporter();
    if (!transporter) {
      throw new Error(
        'Email is not configured. Add EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD to backend/.env (use a Gmail App Password for Gmail).'
      );
    }

    const from = config.email.from || `AI Invoice <${config.email.user}>`;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      attachments,
    });

    const result = { success: true, messageId: info.messageId };

    if (this._usingEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        result.previewUrl = previewUrl;
        console.log('[Email] Preview:', previewUrl);
      }
    }

    return result;
  }

  async sendInvoiceEmail(recipientEmail, invoice, pdfPath, companyName, currency = 'INR') {
    const html = this.baseTemplate(
      `Invoice ${invoice.invoice_number}`,
      `
        <p>Dear ${invoice.customer_name || 'Customer'},</p>
        <p>Please find your invoice attached.</p>
        <div class="box">
          <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
          <p><strong>Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString()}</p>
          <p><strong>Due:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          <p><strong>Amount:</strong> ${this.formatMoney(invoice.total, currency)}</p>
          <p><strong>Status:</strong> ${String(invoice.status).toUpperCase()}</p>
        </div>
        ${invoice.notes ? `<p><strong>Notes:</strong><br>${invoice.notes}</p>` : ''}
        <p>Thank you for your business!</p>
        <p>— ${companyName || 'AI Invoice Generator'}</p>
      `
    );

    return this.sendMail({
      to: recipientEmail,
      subject: `Invoice ${invoice.invoice_number} from ${companyName || 'AI Invoice Generator'}`,
      html,
      attachments: pdfPath
        ? [{ filename: `invoice-${invoice.invoice_number}.pdf`, path: pdfPath }]
        : [],
    });
  }

  async sendWelcomeEmail(userEmail, userName) {
    const html = this.baseTemplate(
      'Welcome!',
      `
        <p>Hi ${userName},</p>
        <p>Thanks for joining <strong>AI Invoice Generator</strong>.</p>
        <p>You can create invoices, track expenses, manage inventory, and use AI suggestions.</p>
        <p>Best regards,<br>The AI Invoice Generator Team</p>
      `
    );

    return this.sendMail({
      to: userEmail,
      subject: 'Welcome to AI Invoice Generator',
      html,
    });
  }

  async sendPaymentReceiptToCustomer(customerEmail, invoice, companyName, currency = 'INR') {
    const html = this.baseTemplate(
      'Payment Received',
      `
        <p>Dear ${invoice.customer_name || 'Customer'},</p>
        <p>We have received your payment. Thank you!</p>
        <div class="box">
          <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
          <p><strong>Amount paid:</strong> ${this.formatMoney(invoice.total, currency)}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>— ${companyName || 'AI Invoice Generator'}</p>
      `
    );

    return this.sendMail({
      to: customerEmail,
      subject: `Payment received — Invoice ${invoice.invoice_number}`,
      html,
    });
  }

  async sendInvoicePaidToOwner(ownerEmail, ownerName, invoice, currency = 'INR') {
    const html = this.baseTemplate(
      'Invoice Paid',
      `
        <p>Hi ${ownerName || 'there'},</p>
        <p>An invoice was marked as <strong>paid</strong>.</p>
        <div class="box">
          <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
          <p><strong>Customer:</strong> ${invoice.customer_name || '—'}</p>
          <p><strong>Amount:</strong> ${this.formatMoney(invoice.total, currency)}</p>
        </div>
      `
    );

    return this.sendMail({
      to: ownerEmail,
      subject: `Payment recorded: ${invoice.invoice_number}`,
      html,
    });
  }

  async sendTestEmail(toEmail) {
    const html = this.baseTemplate(
      'Test Email',
      `
        <p>This is a test email from <strong>AI Invoice Generator</strong>.</p>
        <p>If you received this, your SMTP settings in <code>.env</code> are working.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      `
    );

    return this.sendMail({
      to: toEmail,
      subject: 'AI Invoice Generator — Test Email',
      html,
    });
  }
}

export default new EmailService();
