# Kailas Petromines — Management System

Professional Vue.js 3 Fuel Station Management System for HP Petrol Pumps.

---

## 🚀 Tech Stack

| Layer     | Technology                          |
|-----------|--------------------------------------|
| Frontend  | Vue.js 3 + Composition API           |
| State     | Pinia                                |
| Router    | Vue Router 4                         |
| Styling   | Tailwind CSS                         |
| Charts    | Chart.js + vue-chartjs               |
| HTTP      | Axios                                |
| Build     | Vite 5                               |
| Backend   | Node.js + Express.js (separate repo) |
| Database  | MongoDB + Mongoose                   |

---

## 📁 Project Structure

```
petromines/
├── src/
│   ├── assets/css/main.css       # Global styles & design tokens
│   ├── components/
│   │   ├── charts/BaseChart.vue  # Reusable Chart.js wrapper
│   │   ├── common/
│   │   │   ├── AppLayout.vue     # Main layout (sidebar + topbar)
│   │   │   ├── AppSidebar.vue    # Navigation sidebar
│   │   │   ├── AppTopbar.vue     # Top header bar
│   │   │   └── NavItem.vue       # Sidebar nav link
│   │   └── ui/
│   │       ├── KpiCard.vue       # KPI metric card
│   │       ├── PageHeader.vue    # Page title + breadcrumb
│   │       ├── StatRow.vue       # Horizontal stat strip
│   │       ├── FuelBar.vue       # Fuel level progress bar
│   │       └── DataTable.vue     # Reusable data table
│   ├── router/index.js           # Vue Router with guards
│   ├── services/api.js           # Axios API service layer
│   ├── stores/
│   │   ├── auth.js               # Authentication state
│   │   ├── ui.js                 # Toast, sidebar state
│   │   ├── dashboard.js          # Dashboard KPIs & charts
│   │   ├── sales.js              # Sales CRUD
│   │   ├── staff.js              # Staff & payroll
│   │   └── stock.js              # Fuel stock
│   ├── utils/format.js           # Number formatters
│   ├── views/
│   │   ├── LoginView.vue         # Login page
│   │   ├── DashboardView.vue     # Main dashboard
│   │   ├── SalesView.vue         # All sales records
│   │   ├── SaleEntryView.vue     # New sale form
│   │   ├── StockView.vue         # Stock summary
│   │   ├── MeterView.vue         # Meter readings
│   │   ├── TransactionsView.vue  # Card/PhonePe transactions
│   │   ├── ExpensesView.vue      # Expense tracker
│   │   ├── StaffView.vue         # Staff & salary
│   │   ├── TimesheetView.vue     # Attendance register
│   │   ├── ReportsView.vue       # Monthly reports & P&L
│   │   ├── SettingsView.vue      # Configuration
│   │   └── NotFoundView.vue      # 404 page
│   ├── App.vue                   # Root component + toasts
│   └── main.js                   # App entry point
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 🏃 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env

# 3. Edit .env — set your backend URL
VITE_API_BASE_URL=http://localhost:3000/api/v1

# 4. Start dev server
npm run dev

# 5. Build for production
npm run build
```

---

## 🔌 API Endpoints (Express Backend)

### Auth
```
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Dashboard
```
GET  /api/v1/dashboard/kpis?period=2026-04
GET  /api/v1/dashboard/daily-trend?period=2026-04
GET  /api/v1/dashboard/fuel-mix?period=2026-04
GET  /api/v1/dashboard/stock-levels
GET  /api/v1/dashboard/payment-split?period=2026-04
```

### Sales
```
GET    /api/v1/sales?month=4&year=2026
POST   /api/v1/sales
PUT    /api/v1/sales/:id
DELETE /api/v1/sales/:id
GET    /api/v1/sales/export/excel?period=2026-04
GET    /api/v1/sales/export/pdf?period=2026-04
POST   /api/v1/sales/import
```

### Stock
```
GET  /api/v1/stock?month=4&year=2026
POST /api/v1/stock
GET  /api/v1/stock/summary
GET  /api/v1/stock/tankwise
```

### Meter Readings
```
GET  /api/v1/meters?month=4&year=2026
POST /api/v1/meters
GET  /api/v1/meters/nozzles
```

### Transactions
```
GET  /api/v1/transactions?month=4&year=2026
POST /api/v1/transactions
GET  /api/v1/transactions/summary
```

### Expenses
```
GET  /api/v1/expenses?month=4&year=2026
POST /api/v1/expenses
GET  /api/v1/expenses/categories
GET  /api/v1/expenses/summary
```

### Staff
```
GET  /api/v1/staff
POST /api/v1/staff
GET  /api/v1/staff/advances?month=4&year=2026
POST /api/v1/staff/advances
GET  /api/v1/staff/timesheet?month=4&year=2026
POST /api/v1/staff/attendance
```

### Reports
```
GET /api/v1/reports/monthly?period=2026-04
GET /api/v1/reports/fuel?period=2026-04
GET /api/v1/reports/pnl?period=2026-04
GET /api/v1/reports/staff?period=2026-04
GET /api/v1/reports/export/pdf?period=2026-04
GET /api/v1/reports/export/excel?period=2026-04
```

### Settings
```
GET /api/v1/settings
PUT /api/v1/settings
GET /api/v1/settings/fuel-rates
PUT /api/v1/settings/fuel-rates
GET /api/v1/settings/users
POST/PUT/DELETE /api/v1/settings/users/:id
```

---

## 👤 Roles & Permissions

| Feature           | Admin | Manager | Staff |
|-------------------|-------|---------|-------|
| Dashboard         | ✅    | ✅      | ✅    |
| View Sales        | ✅    | ✅      | ✅    |
| Create/Edit Sales | ✅    | ✅      | ✅    |
| Delete Sales      | ✅    | ❌      | ❌    |
| Stock Management  | ✅    | ✅      | ❌    |
| Staff Salaries    | ✅    | ✅      | ❌    |
| Reports           | ✅    | ✅      | ❌    |
| Settings          | ✅    | ❌      | ❌    |

---

## 📊 MongoDB Schema (Summary)

```js
// Sales
{ saleDate, shift, msVolume, msRate, hsdVolume, hsdRate,
  speedVolume, speedRate, revenue, cash, card, phonePe,
  creditSale, expenses, balance, narration, createdBy }

// Staff  
{ name, role, phone, ratePerDay, shiftHours, daysWorked,
  workingSalary, totalAdvance, finalPayout, isActive }

// Stock
{ date, fuelType, openingStock, received, netStock,
  closingStock, actualSale, variation }

// MeterReading
{ date, nozzleId, fuelType, openingMeter, closingMeter, consumption }

// Expense
{ date, amount, category, description, createdBy }

// Transaction
{ date, bank, amount, type, reference, remarks }
```

---

## 🎨 Design System

- **Font**: Rajdhani (headings) + DM Sans (body) + DM Mono (numbers)
- **Theme**: Dark (#0a0c10 base), gold accent (#f59e0b)
- **Colors**: MS=amber, HSD=green, Speed=blue, Cash=green, PhonePe=indigo
- **Charts**: Chart.js with dark grid (#242d3e), muted ticks (#5a6a82)

---

## 📦 Client Deployment

Each client gets their own deployment with custom:
- `VITE_API_BASE_URL` pointing to their backend
- Station name configured in Settings
- Custom dealer code and GST

---

*Built for Kailas Petromines, Khopoli — April 2026*
