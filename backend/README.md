# AI Invoice Generator - Backend

RESTful API backend for AI Invoice Generator built with Node.js, Express.js, and PostgreSQL.

## Architecture

### Design Patterns
- **MVC (Model-View-Controller)** - Separation of concerns
- **Repository Pattern** - Data access layer abstraction
- **Service Layer** - Business logic encapsulation
- **Middleware Pattern** - Request processing pipeline
- **Dependency Injection** - Loose coupling between components

### Folder Structure
```
backend/
├── src/
│   ├── ai/                  # AI service integration (OpenAI)
│   ├── config/              # Configuration files
│   │   ├── database.js      # Database connection
│   │   ├── env.js           # Environment variables
│   │   ├── schema.sql       # Database schema
│   │   └── migrate.js       # Migration script
│   ├── controllers/         # Request handlers
│   │   ├── authController.js
│   │   ├── invoiceController.js
│   │   ├── transactionController.js
│   │   ├── walletController.js
│   │   ├── dashboardController.js
│   │   └── aiController.js
│   ├── middlewares/         # Custom middlewares
│   │   ├── auth.js          # Authentication middleware
│   │   ├── validate.js      # Validation middleware
│   │   ├── errorHandler.js  # Error handling
│   │   └── rateLimiter.js   # Rate limiting
│   ├── repositories/        # Data access layer
│   │   ├── userRepository.js
│   │   ├── invoiceRepository.js
│   │   ├── transactionRepository.js
│   │   ├── walletRepository.js
│   │   └── customerRepository.js
│   ├── routes/              # API route definitions
│   │   ├── authRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── walletRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── aiRoutes.js
│   ├── services/            # Business logic layer
│   │   ├── authService.js
│   │   ├── invoiceService.js
│   │   ├── transactionService.js
│   │   ├── walletService.js
│   │   └── dashboardService.js
│   ├── utils/               # Utility functions
│   │   ├── logger.js        # Winston logger
│   │   ├── response.js      # API response formatter
│   │   ├── jwt.js           # JWT utilities
│   │   ├── encryption.js    # Password hashing
│   │   ├── pdfGenerator.js  # PDF generation
│   │   └── emailService.js  # Email service
│   ├── validations/         # Input validation schemas
│   │   ├── authValidation.js
│   │   └── invoiceValidation.js
│   ├── app.js               # Express application
│   └── server.js            # Server entry point
├── uploads/                 # File uploads directory
├── logs/                    # Application logs
├── package.json
└── .env.example
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure `.env`:
```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ai_invoice_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

OPENAI_API_KEY=your_openai_key

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password
```

4. Create database:
```bash
createdb ai_invoice_db
```

5. Run migrations:
```bash
npm run migrate
```

6. Start server:
```bash
npm run dev
```

## API Documentation

All authenticated REST endpoints use the **`/api/v1`** prefix (e.g. `/api/v1/invoices`).  
`GET /api/health` and `GET /api/v1/health` are both available for health checks.

### Authentication Endpoints

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "company_name": "Acme Inc"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/v1/auth/profile
Authorization: Bearer <token>
```

### Invoice Endpoints

#### Create Invoice
```http
POST /api/v1/invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer": {
    "name": "Client Name",
    "email": "client@example.com"
  },
  "invoice_date": "2024-01-01",
  "due_date": "2024-01-31",
  "items": [
    {
      "product_name": "Service",
      "description": "Description",
      "quantity": 1,
      "unit_price": 100,
      "total": 100
    }
  ],
  "subtotal": 100,
  "tax_rate": 10,
  "tax_amount": 10,
  "total": 110
}
```

#### Get All Invoices
```http
GET /api/v1/invoices?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

#### Download Invoice PDF
```http
GET /api/v1/invoices/:id/download
Authorization: Bearer <token>
```

#### Send Invoice Email
```http
POST /api/v1/invoices/:id/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "recipientEmail": "client@example.com"
}
```

### AI Endpoints

#### Generate Description
```http
POST /api/v1/ai/generate-description
Authorization: Bearer <token>
Content-Type: application/json

{
  "productName": "Web Development",
  "context": "E-commerce website"
}
```

#### Suggest Tax Rate
```http
POST /api/v1/ai/suggest-tax
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "Software Services",
  "location": "US"
}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Invoices Table
```sql
CREATE TABLE invoices (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    customer_id UUID REFERENCES customers(id),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent abuse
- **Input Validation** - Express validator
- **SQL Injection Prevention** - Parameterized queries
- **CORS Protection** - Configured origins
- **Helmet** - Security headers

## Error Handling

Centralized error handling with consistent response format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## Logging

Winston logger with multiple transports:
- Console (development)
- File (error.log, combined.log)

## Production

See [PRODUCTION.md](../PRODUCTION.md) at the project root for deployment, Docker, auth tokens, and security checklist.

Key production settings:

- `NODE_ENV=production` — enables API rate limits
- `JWT_SECRET` — minimum 16 characters
- `JWT_EXPIRE=15m` and `JWT_REFRESH_EXPIRE=7d` — access + refresh token rotation
- `FRONTEND_URL` — CORS origin for your frontend

Health check: `GET /api/health`

## Scripts

```bash
npm run dev      # Start development server
npm start        # Start production server
npm run migrate  # Run database migrations
npm test         # Run Vitest tests
```

## Dependencies

### Core
- express - Web framework
- pg - PostgreSQL client
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication

### Middleware
- cors - CORS handling
- helmet - Security headers
- morgan - HTTP logging
- zod - Input validation
- express-rate-limit - Rate limiting

### Utilities
- winston - Logging
- nodemailer - Email service
- pdfkit - PDF generation
- @google/generative-ai - Gemini AI integration
- dotenv - Environment variables

## License
MIT
