import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ── Lazy-loaded views ──────────────────────────────────────────────
const LoginView       = () => import('@/views/LoginView.vue')
const DashboardView   = () => import('@/views/DashboardView.vue')
const SalesView       = () => import('@/views/SalesView.vue')
const SaleEntryView   = () => import('@/views/SaleEntryView.vue')
const StockView       = () => import('@/views/StockView.vue')
const MeterView       = () => import('@/views/MeterView.vue')
const TransactionsView= () => import('@/views/TransactionsView.vue')
const ExpensesView    = () => import('@/views/ExpensesView.vue')
const StaffView       = () => import('@/views/StaffView.vue')
const TimesheetView   = () => import('@/views/TimesheetView.vue')
const ReportsView     = () => import('@/views/ReportsView.vue')
const SettingsView    = () => import('@/views/SettingsView.vue')
const NotFoundView    = () => import('@/views/NotFoundView.vue')
const AppLayout       = () => import('@/components/common/AppLayout.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { public: true, title: 'Login — Kailas Petromines' }
  },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard', icon: '🏠', breadcrumb: ['Dashboard'] }
      },
      {
        path: 'sales',
        name: 'Sales',
        component: SalesView,
        meta: { title: 'Petrol Sales', icon: '⛽', breadcrumb: ['Sales'] }
      },
      {
        path: 'sales/new',
        name: 'SaleEntry',
        component: SaleEntryView,
        meta: { title: 'New Sale Entry', icon: '➕', breadcrumb: ['Sales', 'New Entry'] }
      },
      {
        path: 'stock',
        name: 'Stock',
        component: StockView,
        meta: { title: 'Stock Summary', icon: '🛢️', breadcrumb: ['Stock'] }
      },
      {
        path: 'meter',
        name: 'Meter',
        component: MeterView,
        meta: { title: 'Meter Readings', icon: '📊', breadcrumb: ['Meter Readings'] }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: TransactionsView,
        meta: { title: 'Card Transactions', icon: '💳', breadcrumb: ['Transactions'] }
      },
      {
        path: 'expenses',
        name: 'Expenses',
        component: ExpensesView,
        meta: { title: 'Expenses', icon: '💸', breadcrumb: ['Expenses'] }
      },
      {
        path: 'staff',
        name: 'Staff',
        component: StaffView,
        meta: { title: 'Staff & Salary', icon: '👥', breadcrumb: ['Staff'] }
      },
      {
        path: 'timesheet',
        name: 'Timesheet',
        component: TimesheetView,
        meta: { title: 'Time Sheet', icon: '🕐', breadcrumb: ['Time Sheet'] }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: ReportsView,
        meta: { title: 'Reports', icon: '📋', breadcrumb: ['Reports'] }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: SettingsView,
        meta: { title: 'Settings', icon: '⚙️', breadcrumb: ['Settings'] }
      },
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundView,
    meta: { public: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// ── Navigation Guard ──────────────────────────────────────────────
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // Update page title
  if (to.meta.title) document.title = `${to.meta.title} — Kailas Petromines`

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && auth.isLoggedIn) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
