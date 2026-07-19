import axios from 'axios'

// ── Base Axios instance ───────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor: attach Bearer token (skip login) ────────
api.interceptors.request.use((config) => {
  if (!config.url?.endsWith('/login')) {
    const token = localStorage.getItem('pm_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor: unwrap data, redirect on 401 ───────────
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
  login:   (creds) => api.post('/user/login', creds),
  logout:  ()      => api.post('/user/logout'),
  me:      ()      => api.post('/user/profile'),
  updateProfile:  (data) => api.put('/user/profile', data),
  changePassword: (data) => api.post('/user/change-password', data),
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
  getLastReadings: (params) => api.get('/meters/last-readings', { params }),
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
  getTotalForDate: (params) => api.get('/expenses/total-for-date', { params }),
}

// ──────────────────────────────────────────────────────────────────
// STAFF
// ──────────────────────────────────────────────────────────────────
export const staffApi = {
  // Staff CRUD
  getAll:       (params)   => api.get('/staff',              { params }),
  getById:      (id)       => api.get(`/staff/${id}`),
  create:       (data)     => api.post('/staff',               data),
  update:       (id, data) => api.put(`/staff/${id}`,          data),
  delete:       (id)       => api.delete(`/staff/${id}`),

  // Advances
  getAdvances:  (params)   => api.get('/staff/advances',     { params }),
  addAdvance:   (data)     => api.post('/staff/advances',      data),

  // Daily attendance
  getAttendance:    (params)   => api.get('/staff/attendance',       { params }),
  markAttendance:   (data)     => api.post('/staff/attendance',        data),
  bulkAttendance:   (data)     => api.post('/staff/attendance/bulk',   data),
  getAttendanceById:(id)       => api.get(`/staff/attendance/${id}`),
  updateAttendance: (id, data) => api.put(`/staff/attendance/${id}`,   data),
  deleteAttendance: (id)       => api.delete(`/staff/attendance/${id}`),

  // Monthly timesheet summary
  getTimesheet: (params)   => api.get('/staff/timesheet',    { params }),

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
  // Station details
  getStation:           (params) => api.get('/settings', { params }),
  updateStation:        (data)   => api.put('/settings', data),

  // Fuel rates
  getFuelRates:         (params) => api.get('/settings/fuel-rates', { params }),
  updateFuelRates:      (data)   => api.put('/settings/fuel-rates', data),

  // Nozzles
  getNozzles:           (params) => api.get('/settings/nozzles', { params }),
  storeNozzle:          (data)   => api.post('/settings/nozzles', data),
  updateNozzle:         (id, d)  => api.put(`/settings/nozzles/${id}`, d),
  deleteNozzle:         (id)     => api.delete(`/settings/nozzles/${id}`),

  // Notification preferences
  getNotifications:     ()       => api.get('/settings/notifications'),
  updateNotifications:  (data)   => api.put('/settings/notifications', data),
}

// ──────────────────────────────────────────────────────────────────
// STATIONS — owner only
// ──────────────────────────────────────────────────────────────────
export const stationApi = {
  getAll: ()         => api.get('/stations'),
  create: (data)     => api.post('/stations', data),
  update: (id, data) => api.put(`/stations/${id}`, data),
  delete: (id)        => api.delete(`/stations/${id}`),
}

// ──────────────────────────────────────────────────────────────────
// USER — sub-user (manager) management
// ──────────────────────────────────────────────────────────────────
export const userApi = {
  getSubUsers:   ()      => api.post('/user/sub-users'),
  addSubUser:    (data)  => api.post('/user/add-sub-user', data),
  getSubUser:    (data)  => api.post('/user/sub-users-details', data),
  updateSubUser: (data)  => api.post('/user/update-sub-user', data),
  deleteSubUser: (data)  => api.post('/user/delete-sub-user', data),
}

// ──────────────────────────────────────────────────────────────────
// ADMIN (separate axios instance — uses pm_admin_token)
// ──────────────────────────────────────────────────────────────────
const adminAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

adminAxios.interceptors.request.use((config) => {
  if (!config.url?.endsWith('/login')) {
    const token = localStorage.getItem('pm_admin_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

adminAxios.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('pm_admin_token')
      localStorage.removeItem('pm_admin')
      window.location.href = '/admin/login'
    }
    return Promise.reject(err.response?.data || { message: err.message })
  }
)

export const adminApi = {
  login:          (creds) => adminAxios.post('/admin/login', creds),
  logout:         ()      => adminAxios.post('/admin/logout'),
  getUsers:       ()      => adminAxios.post('/admin/users'),
  addUser:        (data)  => adminAxios.post('/admin/add-user', data),
  getUserDetails: (data)  => adminAxios.post('/admin/get-user-details', data),
  updateUser:     (data)  => adminAxios.post('/admin/update-user', data),
  deleteUser:     (data)  => adminAxios.post('/admin/delete-user', data),
}

export default api
