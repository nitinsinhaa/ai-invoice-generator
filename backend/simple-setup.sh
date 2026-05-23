#!/bin/bash

# AI Invoice Generator - Simple Setup Script (No sudo required)
# This script generates JWT secret and database password
# You'll need to create the database manually

set -e

echo "🚀 AI Invoice Generator - Simple Setup"
echo "======================================"
echo ""

# Generate secure random strings
generate_random_string() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Generate JWT secret
echo "🔑 Generating JWT secret..."
JWT_SECRET=$(generate_random_string)

# Generate database password
echo "🔐 Generating database password..."
DB_PASSWORD=$(generate_random_string)

# Database configuration
DB_NAME="ai_invoice_db"
DB_USER="postgres"

echo ""
echo "✅ Generated Credentials:"
echo "   JWT Secret: $JWT_SECRET"
echo "   DB Password: $DB_PASSWORD"
echo ""

# Create .env file
echo "📝 Creating .env file..."
cat > .env << EOF
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

JWT_SECRET=$JWT_SECRET
JWT_EXPIRE=7d

# Set your key in .env after setup — never commit real API keys
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

echo "✅ .env file created!"

# Save credentials
cat > credentials.txt << EOF
AI Invoice Generator - Credentials
===================================

Generated on: $(date)

DATABASE CREDENTIALS:
--------------------
Database Name: $DB_NAME
Database User: $DB_USER
Database Password: $DB_PASSWORD

JWT SECRET:
-----------
$JWT_SECRET

GEMINI API KEY:
--------------
(Set manually in .env — see GEMINI_API_KEY)

CONNECTION STRING:
-----------------
postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

MANUAL DATABASE SETUP:
---------------------
Run these commands in PostgreSQL:

CREATE DATABASE $DB_NAME;
\c $DB_NAME

Then run migrations:
npm run migrate
EOF

echo "✅ Credentials saved to credentials.txt"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Create the database manually:"
echo "   createdb $DB_NAME"
echo ""
echo "2. Install dependencies:"
echo "   npm install"
echo ""
echo "3. Run migrations:"
echo "   npm run migrate"
echo ""
echo "4. Start the server:"
echo "   npm run dev"
echo ""
echo "🔐 Your credentials are saved in credentials.txt"
echo ""
validate_gemini_api_key() {
  if ! grep -qE '^GEMINI_API_KEY=.' .env 2>/dev/null || grep -qE '^GEMINI_API_KEY=your_gemini_api_key_here' .env; then
    echo ""
    echo "✗ GEMINI_API_KEY must be set in .env (replace your_gemini_api_key_here) before proceeding."
    echo "  Get a key from https://aistudio.google.com/apikey"
    exit 1
  fi
}

validate_gemini_api_key
echo "✅ Setup complete!"
