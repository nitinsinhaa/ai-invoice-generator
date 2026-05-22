# AI Invoice Generator - Frontend

Modern React-based frontend for AI Invoice Generator with a professional SaaS-style UI.

## Features

- 📊 **Analytics Dashboard** - Real-time statistics and charts
- 📄 **Invoice Management** - Create, edit, and manage invoices
- 💰 **Wallet System** - Track balance and transactions
- 🤖 **AI Integration** - Smart invoice generation
- ⚙️ **Settings** - Customizable user preferences
- 🎨 **Modern UI** - Clean, professional design with Tailwind CSS

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

## Project Structure

```
frontend/
├── src/
│   ├── api/                 # API service layer
│   │   ├── axios.js         # Axios instance
│   │   ├── authApi.js       # Auth endpoints
│   │   ├── invoiceApi.js    # Invoice endpoints
│   │   ├── transactionApi.js
│   │   ├── walletApi.js
│   │   ├── dashboardApi.js
│   │   └── aiApi.js
│   ├── components/          # Reusable components
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── StatCard.jsx
│   │   ├── Table.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   └── LoadingSpinner.jsx
│   ├── context/             # React Context
│   │   └── AuthContext.jsx
│   ├── layouts/             # Layout components
│   │   └── DashboardLayout.jsx
│   ├── pages/               # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Transactions.jsx
│   │   ├── Invoices.jsx
│   │   ├── Wallet.jsx
│   │   └── Settings.jsx
│   ├── routes/              # Route configuration
│   │   └── ProtectedRoute.jsx
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment:
```bash
cp .env.example .env
```

3. Configure `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start development server:
```bash
npm run dev
```

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Components

### Reusable Components

#### Sidebar
Navigation sidebar with active state highlighting.

```jsx
import Sidebar from './components/Sidebar';

<Sidebar />
```

#### Header
Page header with search and user profile.

```jsx
import Header from './components/Header';

<Header title="Dashboard" />
```

#### StatCard
Statistics card with icon and trend.

```jsx
import StatCard from './components/StatCard';

<StatCard
  title="Total Revenue"
  value="$12,345"
  icon={DollarSign}
  color="green"
  trend="up"
  trendValue="12.5%"
/>
```

#### Table
Data table with customizable columns.

```jsx
import Table from './components/Table';

const columns = [
  { header: 'Name', accessor: 'name' },
  { header: 'Email', accessor: 'email' },
];

<Table columns={columns} data={data} />
```

#### Modal
Reusable modal component.

```jsx
import Modal from './components/Modal';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Create Invoice"
  size="lg"
>
  {/* Modal content */}
</Modal>
```

## State Management

### Auth Context

Manages authentication state globally.

```jsx
import { useAuth } from './context/AuthContext';

const { user, login, logout } = useAuth();
```

## API Integration

### Making API Calls

```jsx
import { invoiceApi } from './api/invoiceApi';

// Get invoices
const response = await invoiceApi.getInvoices({ page: 1, limit: 10 });

// Create invoice
const invoice = await invoiceApi.createInvoice(data);

// Download PDF
await invoiceApi.downloadInvoice(id);
```

## Routing

### Protected Routes

```jsx
import ProtectedRoute from './routes/ProtectedRoute';

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

## Styling

### Tailwind CSS

Custom utility classes defined in `index.css`:

```css
.btn-primary {
  @apply bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg;
}

.input-field {
  @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500;
}

.card {
  @apply bg-white rounded-xl shadow-sm border border-gray-100 p-6;
}
```

### Color Palette

Primary (Green):
- 50: #f0fdf4
- 100: #dcfce7
- 400: #4ade80
- 500: #22c55e
- 600: #16a34a

## Features Implementation

### Dashboard
- Real-time statistics
- Revenue/Expense charts
- Recent transactions
- Expense breakdown pie chart
- Timeframe filters

### Invoices
- Create/Edit invoices
- AI-powered descriptions
- PDF download
- Email sending
- Status tracking

### Wallet
- Balance display
- Add/Withdraw funds
- Transaction history
- Bank account management

### Settings
- Profile management
- Company information
- Password change
- Preferences (currency, theme, notifications)

## Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Environment Variables

- `VITE_API_URL` - Backend API URL

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimization

- Code splitting with React.lazy
- Image optimization
- Minification and compression
- Tree shaking
- Lazy loading routes

## Accessibility

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support

## License
MIT
