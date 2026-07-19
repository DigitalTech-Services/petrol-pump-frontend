import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminAuthStore } from '@/stores/adminAuth'

// ── Lazy-loaded views ──────────────────────────────────────────────
const LoginView       = () => import('@/views/LoginView.vue')
const AdminLoginView  = () => import('@/views/AdminLoginView.vue')
const AdminUsersView  = () => import('@/views/AdminUsersView.vue')
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
const ManagersView    = () => import('@/views/ManagersView.vue')
const StationsView    = () => import('@/views/StationsView.vue')
const BusinessProfileView = () => import('@/views/BusinessProfileView.vue')
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
    path: '/admin/login',
    name: 'AdminLogin',
    component: AdminLoginView,
    meta: { public: true, title: 'Admin Login — Kailas Petromines' }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUsersView,
    meta: { requiresAdminAuth: true, title: 'Manage Users — Admin' }
  },
  {
    path: '/admin',
    redirect: '/admin/users'
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
        meta: { title: 'Dashboard', breadcrumb: ['Dashboard'] }
      },
      {
        path: 'sales',
        name: 'Sales',
        component: SalesView,
        meta: { title: 'Petrol Sales', breadcrumb: ['Sales'] }
      },
      {
        path: 'sales/new',
        name: 'SaleEntry',
        component: SaleEntryView,
        // Pure creation form — no read-only meaning, stays manager-only.
        meta: { title: 'New Sale Entry', breadcrumb: ['Sales', 'New Entry'], role: 'manager' }
      },
      {
        path: 'stock',
        name: 'Stock',
        component: StockView,
        meta: { title: 'Stock Summary', breadcrumb: ['Stock'] }
      },
      {
        path: 'meter',
        name: 'Meter',
        component: MeterView,
        meta: { title: 'Meter Readings', breadcrumb: ['Meter Readings'] }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: TransactionsView,
        meta: { title: 'Card Transactions', breadcrumb: ['Transactions'], role: 'manager' }
      },
      {
        path: 'expenses',
        name: 'Expenses',
        component: ExpensesView,
        meta: { title: 'Expenses', breadcrumb: ['Expenses'], role: 'manager' }
      },
      {
        path: 'staff',
        name: 'Staff',
        component: StaffView,
        meta: { title: 'Staff & Salary', breadcrumb: ['Staff'], role: 'manager' }
      },
      {
        path: 'timesheet',
        name: 'Timesheet',
        component: TimesheetView,
        meta: { title: 'Time Sheet', breadcrumb: ['Time Sheet'], role: 'manager' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: ReportsView,
        meta: { title: 'Reports', breadcrumb: ['Reports'] }
      },
      {
        path: 'settings',
        name: 'Settings',
        component: SettingsView,
        meta: { title: 'Settings', breadcrumb: ['Settings'] }
      },
      {
        path: 'managers',
        name: 'Managers',
        component: ManagersView,
        meta: { title: 'Managers', breadcrumb: ['Managers'], role: 'owner' }
      },
      {
        path: 'stations',
        name: 'Stations',
        component: StationsView,
        meta: { title: 'Stations', breadcrumb: ['Stations'], role: 'owner' }
      },
      {
        path: 'business-profile',
        name: 'BusinessProfile',
        component: BusinessProfileView,
        meta: { title: 'Business Profile', breadcrumb: ['Business Profile'], role: 'owner' }
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
router.beforeEach((to, _from, next) => {
  const auth      = useAuthStore()
  const adminAuth = useAdminAuthStore()

  if (to.meta.title) document.title = `${to.meta.title} — Kailas Petromines`

  if (to.meta.requiresAdminAuth && !adminAuth.isLoggedIn) {
    next({ name: 'AdminLogin', query: { redirect: to.fullPath } })
  } else if (to.name === 'AdminLogin' && adminAuth.isLoggedIn) {
    next({ name: 'AdminUsers' })
  } else if (to.meta.requiresAuth && !auth.isLoggedIn) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.name === 'Login' && auth.isLoggedIn) {
    next({ name: 'Dashboard' })
  } else if (to.meta.role === 'owner' && !auth.isOwner) {
    // Managers can't manage other managers
    next({ name: 'Dashboard' })
  } else if (to.meta.role === 'manager' && !auth.isManager) {
    // Owner is stats + manager-management only, no operational screens
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
