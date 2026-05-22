#!/bin/bash

# AI Invoice Generator - Environment Setup Script
# This script creates the .env file with your configuration

cat > .env << 'EOF'
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_invoice_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

JWT_SECRET=a8f5f167f44f4964e6c998dee827110c3e7e5a8f5f167f44f4964e6c998dee827110c
JWT_EXPIRE=7d

GEMINI_API_KEY=your_gemini_api_key_here

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_app_password
EMAIL_FROM=AI Invoice Generator <noreply@aiinvoice.com>

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

echo "✅ .env file created successfully!"
echo ""
echo "⚠️  IMPORTANT: Please update the following in your .env file:"
echo "   - DB_PASSWORD (your PostgreSQL password)"
echo "   - EMAIL_USER (your email address)"
echo "   - EMAIL_PASSWORD (your email app password)"
echo ""
echo "📝 Your Gemini API key has been configured!"
echo "🔑 JWT secret has been auto-generated"
