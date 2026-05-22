# Email notifications setup

## Does Node.js have built-in email?

**No.** Node.js does not include an email server. This project uses **[Nodemailer](https://nodemailer.com/)** — it connects to an external SMTP provider (Gmail, Outlook, SendGrid, etc.) to send mail.

## Configure `backend/.env`

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=your_16_char_app_password
EMAIL_FROM=AI Invoice Generator <your@gmail.com>
```

### Gmail (recommended for testing)

1. Enable [2-Step Verification](https://myaccount.google.com/security) on your Google account.
2. Create an [App Password](https://myaccount.google.com/apppasswords) for "Mail".
3. Put that 16-character password in `EMAIL_PASSWORD` (not your normal Gmail password).

### Development without Gmail

If `EMAIL_USER` / `EMAIL_PASSWORD` are missing or still placeholders, the backend uses **Ethereal** (fake SMTP). Emails are not delivered to real inboxes — a **preview URL** is printed in the backend terminal.

## What sends email?

| Event | Who receives |
|--------|----------------|
| Register | Welcome email to new user |
| Invoices → Send (mail icon) | Customer + PDF attachment |
| Invoice marked **Paid** | You + payment receipt to customer |
| Settings → Send test email | Your account email |

Toggle **Email Notifications** in Settings to disable automated emails.

## API

- `GET /api/notifications/status` — SMTP connection check
- `POST /api/notifications/test` — send test email (logged-in user)

## Restart backend after changing `.env`

```bash
cd backend && npm run dev
```
