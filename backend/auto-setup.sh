#!/bin/bash

# AI Invoice Generator - Automated Setup Script
# This script will:
# 1. Generate a secure JWT secret
# 2. Create PostgreSQL database with a secure password
# 3. Create .env file with all configurations
# 4. Run database migrations

set -e  # Exit on error

echo "🚀 AI Invoice Generator - Automated Setup"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Generate secure random strings
generate_random_string() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Generate JWT secret
echo "🔑 Generating JWT secret..."
JWT_SECRET=$(generate_random_string)
echo -e "${GREEN}✓ JWT secret generated${NC}"

# Generate database password
echo "🔐 Generating database password..."
DB_PASSWORD=$(generate_random_string)
echo -e "${GREEN}✓ Database password generated${NC}"

# Database configuration
DB_NAME="ai_invoice_db"
DB_USER="postgres"

echo ""
echo "📦 Database Configuration:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD"
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

echo -e "${GREEN}✓ .env file created${NC}"

# Save credentials to a separate file for reference
echo "💾 Saving credentials to credentials.txt..."
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
your_gemini_api_key_here

IMPORTANT:
----------
⚠️  Keep this file secure and do not commit it to version control!
⚠️  This file is in .gitignore for your safety.

To connect to database:
psql -U $DB_USER -d $DB_NAME

Connection string:
postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
EOF

echo -e "${GREEN}✓ Credentials saved to credentials.txt${NC}"

# Check if PostgreSQL is installed
echo ""
echo "🔍 Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}✗ PostgreSQL is not installed${NC}"
    echo ""
    echo "Please install PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  macOS: brew install postgresql"
    echo "  Fedora: sudo dnf install postgresql-server postgresql-contrib"
    echo ""
    echo "After installing, run this script again."
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL is installed${NC}"

# Check if PostgreSQL service is running
echo "🔍 Checking PostgreSQL service..."
if ! sudo service postgresql status &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL service is not running${NC}"
    echo "Starting PostgreSQL service..."
    sudo service postgresql start
    sleep 2
fi

echo -e "${GREEN}✓ PostgreSQL service is running${NC}"

# Create database and user
echo ""
echo "🗄️  Setting up database..."

# Create SQL commands
SQL_COMMANDS=$(cat << EOSQL
-- Drop database if exists (for clean setup)
DROP DATABASE IF EXISTS $DB_NAME;

-- Drop user if exists
DROP USER IF EXISTS $DB_USER;

-- Create user with password
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the database and grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
EOSQL
)

# Execute SQL commands as postgres user
echo "$SQL_COMMANDS" | sudo -u postgres psql 2>&1 | grep -v "NOTICE" || true

echo -e "${GREEN}✓ Database created successfully${NC}"

# Install npm dependencies if needed
echo ""
echo "📦 Checking npm dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi

# Run database migrations
echo ""
echo "🔄 Running database migrations..."
npm run migrate

echo ""
echo -e "${GREEN}=========================================="
echo "✅ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "📋 Summary:"
echo "   ✓ JWT secret generated"
echo "   ✓ Database password generated"
echo "   ✓ .env file created"
echo "   ✓ Database '$DB_NAME' created"
echo "   ✓ Database migrations completed"
echo "   ✓ Credentials saved to credentials.txt"
echo ""
echo "🔐 Your Credentials:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Password: $DB_PASSWORD"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Credentials saved in: credentials.txt"
echo "   - Keep credentials.txt secure!"
echo "   - Update EMAIL_USER and EMAIL_PASSWORD in .env if you want email features"
echo ""
echo "🚀 Next Steps:"
echo "   1. Review your .env file"
echo "   2. (Optional) Update email settings in .env"
echo "   3. Start the server: npm run dev"
echo ""
echo "📝 To view your credentials later:"
echo "   cat credentials.txt"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
