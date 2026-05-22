import emailService from '../utils/emailService.js';
import userRepository from '../repositories/userRepository.js';

class NotificationService {
  async getStatus() {
    try {
      const verification = await emailService.verifyConnection();
      return {
        configured: emailService.isConfigured(),
        ...verification,
      };
    } catch (error) {
      return {
        configured: emailService.isConfigured(),
        ok: false,
        mode: 'error',
        message: error.message,
      };
    }
  }

  wantsNotifications(user) {
    return user?.email_notifications !== false;
  }

  async sendWelcome(userEmail, userName, user) {
    if (!this.wantsNotifications(user)) return null;
    try {
      return await emailService.sendWelcomeEmail(userEmail, userName);
    } catch (error) {
      console.error('[Notification] Welcome email failed:', error.message);
      return null;
    }
  }

  async sendInvoiceToCustomer(user, invoice, pdfPath, recipientEmail) {
    if (!this.wantsNotifications(user)) {
      throw new Error('Email notifications are disabled in Settings');
    }

    const to = recipientEmail || invoice.customer_email;
    if (!to) {
      throw new Error('No customer email address for this invoice');
    }

    return emailService.sendInvoiceEmail(
      to,
      invoice,
      pdfPath,
      user.company_name || user.full_name,
      user.currency || 'INR'
    );
  }

  async onInvoicePaid(userId, invoice) {
    const user = await userRepository.findById(userId);
    if (!user || !this.wantsNotifications(user)) return;

    const currency = user.currency || 'INR';
    const companyName = user.company_name || user.full_name;

    try {
      await emailService.sendInvoicePaidToOwner(user.email, user.full_name, invoice, currency);
    } catch (error) {
      console.error('[Notification] Owner paid alert failed:', error.message);
    }

    if (invoice.customer_email) {
      try {
        await emailService.sendPaymentReceiptToCustomer(
          invoice.customer_email,
          invoice,
          companyName,
          currency
        );
      } catch (error) {
        console.error('[Notification] Customer receipt failed:', error.message);
      }
    }
  }

  async sendTest(user) {
    return emailService.sendTestEmail(user.email);
  }
}

export default new NotificationService();
