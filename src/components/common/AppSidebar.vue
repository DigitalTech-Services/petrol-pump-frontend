<template>
  <aside
    class="fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300"
    :class="[ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']"
    style="width:248px; background:#0f1218; border-right:1px solid #242d3e;">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-5 py-[18px]" style="border-bottom:1px solid #242d3e">
      <div class="w-9 h-9 rounded-[10px] flex items-center justify-center font-display font-bold text-[18px] text-[#0a0c10] flex-shrink-0"
        style="background:linear-gradient(135deg,#f59e0b,#d97706); box-shadow:0 0 20px rgba(245,158,11,0.3)">
        K
      </div>
      <div class="min-w-0">
        <div class="font-display font-bold text-[15px] text-white leading-tight truncate">{{ auth.stationName }}</div>
        <div class="text-[10px] text-[#5a6a82] uppercase tracking-widest"> HP Fuel Station</div>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-3 px-3">
      <div class="mb-1">
        <div class="nav-label">Main</div>
        <NavItem to="/dashboard"    icon="📊" label="Dashboard" />
      </div>

      <div class="mb-1">
        <div class="nav-label">Operations</div>
        <NavItem to="/sales"        icon="⛽" label="Petrol Sales">
          <template #badge><span class="ml-auto text-[10px] font-bold bg-[#f59e0b]/20 text-[#f59e0b] px-1.5 py-0.5 rounded-full">Daily</span></template>
        </NavItem>
        <NavItem to="/sales/new"    icon="➕" label="New Sale Entry" />
        <NavItem to="/stock"        icon="🛢️" label="Stock Summary" />
        <NavItem to="/meter"        icon="📊" label="Meter Readings" />
      </div>

      <div class="mb-1">
        <div class="nav-label">Finance</div>
        <NavItem to="/transactions" icon="💳" label="Card Transactions" />
        <NavItem to="/expenses"     icon="💸" label="Expenses" />
      </div>

      <div class="mb-1">
        <div class="nav-label">HR</div>
        <NavItem to="/staff"        icon="👥" label="Staff & Salary" />
        <NavItem to="/timesheet"    icon="🕐" label="Time Sheet" />
      </div>

      <div class="mb-1">
        <div class="nav-label">Analytics</div>
        <NavItem to="/reports"      icon="📋" label="Reports" />
      </div>

      <div>
        <div class="nav-label">System</div>
        <NavItem to="/settings"     icon="⚙️" label="Settings" />
      </div>
    </nav>

    <!-- User card -->
    <div class="px-3 py-3" style="border-top:1px solid #242d3e">
      <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[#161b24] transition-colors">
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold font-display text-white flex-shrink-0"
          style="background:linear-gradient(135deg,#f59e0b,#6366f1)">
          {{ initials }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[13px] font-semibold text-white truncate">{{ auth.fullName }}</div>
          <div class="text-[11px] text-[#5a6a82] capitalize">{{ auth.role }}</div>
        </div>
        <button
          @click="handleLogout"
          class="text-[#5a6a82] hover:text-[#ef4444] transition-colors text-[12px] flex-shrink-0"
          title="Logout"
        >⏻</button>
      </div>
    </div>

  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore }   from '@/stores/ui'
import NavItem from './NavItem.vue'

const auth   = useAuthStore()
const ui     = useUiStore()
const router = useRouter()

const initials = computed(() => {
  const n = auth.fullName || 'Admin'
  return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav-label {
  font-size: 9px;
  color: #5a6a82;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 6px 10px 3px;
}
</style>
