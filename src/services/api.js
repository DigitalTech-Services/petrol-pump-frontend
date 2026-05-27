import axios from 'axios'

// ── Base Axios instance ───────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor: attach JWT token ─────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor: unwrap data, handle 401 ────────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pm_token')
      localStorage.removeItem('pm_user')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || { message: err.message })
  }
)

// ──────────────────────────────────────────────────────────────────
// AUTH
// ──────────────────────────────────────────────────────────────────
export const authApi = {
  login:   (creds) => api.post('/auth/login', creds),
  logout:  ()      => api.post('/auth/logout'),
  me:      ()      => api.get('/auth/me'),
  refresh: ()      => api.post('/auth/refresh'),
  changePassword: (data) => api.put('/auth/change-password', data),
}

// ──────────────────────────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getKpis:        (params) => api.get('/dashboard/kpis',          { params }),
  getDailyTrend:  (params) => api.get('/dashboard/daily-trend',   { params }),
  getFuelMix:     (params) => api.get('/dashboard/fuel-mix',      { params }),
  getStockLevel:  ()       => api.get('/dashboard/stock-levels'),
  getPaymentSplit:(params) => api.get('/dashboard/payment-split', { params }),
  getSummary:     (params) => api.get('/dashboard/summary',       { params }),
}

// ──────────────────────────────────────────────────────────────────
// SALES
// ──────────────────────────────────────────────────────────────────
export const salesApi = {
  getAll:      (params)    => api.get('/sales',              { params }),
  getById:     (id)        => api.get(`/sales/${id}`),
  create:      (data)      => api.post('/sales',               data),
  update:      (id, data)  => api.put(`/sales/${id}`,          data),
  delete:      (id)        => api.delete(`/sales/${id}`),
  getMonthly:  (params)    => api.get('/sales/monthly',      { params }),
  exportExcel: (params)    => api.get('/sales/export/excel', { params, responseType: 'blob' }),
  exportPdf:   (params)    => api.get('/sales/export/pdf',   { params, responseType: 'blob' }),
  importExcel: (formData)  => api.post('/sales/import',        formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// ──────────────────────────────────────────────────────────────────
// STOCK
// ──────────────────────────────────────────────────────────────────
export const stockApi = {
  getAll:     (params)   => api.get('/stock',           { params }),
  getById:    (id)       => api.get(`/stock/${id}`),
  create:     (data)     => api.post('/stock',            data),
  update:     (id, data) => api.put(`/stock/${id}`,       data),
  delete:     (id)       => api.delete(`/stock/${id}`),
  getSummary: (params)   => api.get('/stock/summary',   { params }),
  getTankwise:(params)   => api.get('/stock/tankwise',  { params }),
}

// ──────────────────────────────────────────────────────────────────
// METER READINGS
// ──────────────────────────────────────────────────────────────────
export const meterApi = {
  getAll:     (params)   => api.get('/meters',          { params }),
  getById:    (id)       => api.get(`/meters/${id}`),
  create:     (data)     => api.post('/meters',           data),
  update:     (id, data) => api.put(`/meters/${id}`,      data),
  delete:     (id)       => api.delete(`/meters/${id}`),
  getNozzles: (params)   => api.get('/meters/nozzles',  { params }),
}

// ──────────────────────────────────────────────────────────────────
// TRANSACTIONS
// ──────────────────────────────────────────────────────────────────
export const transactionApi = {
  getAll:     (params)   => api.get('/transactions',    { params }),
  getById:    (id)       => api.get(`/transactions/${id}`),
  create:     (data)     => api.post('/transactions',     data),
  update:     (id, data) => api.put(`/transactions/${id}`, data),
  delete:     (id)       => api.delete(`/transactions/${id}`),
  getSummary: (params)   => api.get('/transactions/summary', { params }),
}

// ──────────────────────────────────────────────────────────────────
// EXPENSES
// ──────────────────────────────────────────────────────────────────
export const expenseApi = {
  getAll:       (params)   => api.get('/expenses',           { params }),
  getById:      (id)       => api.get(`/expenses/${id}`),
  create:       (data)     => api.post('/expenses',            data),
  update:       (id, data) => api.put(`/expenses/${id}`,       data),
  delete:       (id)       => api.delete(`/expenses/${id}`),
  getCategories:()         => api.get('/expenses/categories'),
  getSummary:   (params)   => api.get('/expenses/summary',   { params }),
}

// ──────────────────────────────────────────────────────────────────
// STAFF
// ──────────────────────────────────────────────────────────────────
export const staffApi = {
  getAll:       (params)   => api.get('/staff',              { params }),
  getById:      (id)       => api.get(`/staff/${id}`),
  create:       (data)     => api.post('/staff',               data),
  update:       (id, data) => api.put(`/staff/${id}`,          data),
  delete:       (id)       => api.delete(`/staff/${id}`),
  getAdvances:  (params)   => api.get('/staff/advances',     { params }),
  addAdvance:   (data)     => api.post('/staff/advances',      data),
  getTimesheet: (params)   => api.get('/staff/timesheet',    { params }),
  markAttendance:(data)    => api.post('/staff/attendance',    data),
  getSalarySlip:(id,params)=> api.get(`/staff/${id}/salary-slip`, { params }),
}

// ──────────────────────────────────────────────────────────────────
// REPORTS
// ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  getMonthly:   (params) => api.get('/reports/monthly',       { params }),
  getFuelReport:(params) => api.get('/reports/fuel',          { params }),
  getPnl:       (params) => api.get('/reports/pnl',           { params }),
  getStaffReport:(params)=> api.get('/reports/staff',         { params }),
  exportPdf:    (params) => api.get('/reports/export/pdf',    { params, responseType: 'blob' }),
  exportExcel:  (params) => api.get('/reports/export/excel',  { params, responseType: 'blob' }),
}

// ──────────────────────────────────────────────────────────────────
// SETTINGS
// ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  get:           ()       => api.get('/settings'),
  update:        (data)   => api.put('/settings', data),
  getFuelRates:  ()       => api.get('/settings/fuel-rates'),
  updateFuelRate:(data)   => api.put('/settings/fuel-rates', data),
  getNozzles:    ()       => api.get('/settings/nozzles'),
  updateNozzle:  (id, d)  => api.put(`/settings/nozzles/${id}`, d),
  getUsers:      ()       => api.get('/settings/users'),
  createUser:    (data)   => api.post('/settings/users', data),
  updateUser:    (id, d)  => api.put(`/settings/users/${id}`, d),
  deleteUser:    (id)     => api.delete(`/settings/users/${id}`),
}

export default api
