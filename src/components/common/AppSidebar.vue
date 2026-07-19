<template>
  <aside class="fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300" :class="[
    ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
  ]" style="width:248px; background:var(--bg-2); border-right:1px solid var(--border);">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-5 py-[18px]" style="border-bottom:1px solid var(--border)">
      <div
        class="w-9 h-9 rounded-[10px] flex items-center justify-center font-display font-bold text-[18px] text-[var(--bg)] flex-shrink-0"
        style="background:linear-gradient(135deg,#f59e0b,#d97706); box-shadow:0 0 20px rgba(245,158,11,0.3)">
        K
      </div>
      <div class="min-w-0">
        <div class="font-display font-bold text-[15px] text-[var(--text)] leading-tight truncate">{{ auth.stationName }}</div>
        <div class="text-[10px] text-[var(--text-3)] uppercase tracking-widest truncate">{{ stationCaption }}</div>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto py-3 px-3">

      <div class="mb-1">
        <div class="nav-label">Main</div>

        <NavItem to="/dashboard" :icon="LayoutDashboard" label="Dashboard" />
      </div>

      <div class="mb-1">
        <div class="nav-label">Operations</div>

        <NavItem to="/sales" :icon="Fuel" label="Petrol Sales">
          <template #badge>
            <span class="ml-auto text-[10px] font-bold
          bg-[#f59e0b]/20 text-[#f59e0b]
          px-1.5 py-0.5 rounded-full">
              Daily
            </span>
          </template>
        </NavItem>

        <NavItem v-if="auth.isManager" to="/sales/new" :icon="CirclePlus" label="New Sale Entry" />

        <NavItem to="/stock" :icon="Warehouse" label="Stock Summary" />

        <NavItem to="/meter" :icon="Gauge" label="Meter Readings" />
      </div>

      <div v-if="auth.isManager" class="mb-1">
        <div class="nav-label">Finance</div>

        <NavItem to="/transactions" :icon="CreditCard" label="Card Transactions" />

        <NavItem to="/expenses" :icon="Receipt" label="Expenses" />
      </div>

      <div v-if="auth.isManager" class="mb-1">
        <div class="nav-label">HR</div>

        <NavItem to="/staff" :icon="Users" label="Staff & Salary" />

        <NavItem to="/timesheet" :icon="Clock3" label="Time Sheet" />
      </div>

      <div class="mb-1">
        <div class="nav-label">Analytics</div>

        <NavItem to="/reports" :icon="BarChart3" label="Reports" />
      </div>

      <div>
        <div class="nav-label">System</div>

        <NavItem to="/settings" :icon="Settings" label="Settings" />
      </div>

      <div v-if="auth.isOwner">
        <div class="nav-label">Team</div>

        <NavItem to="/stations" :icon="Building2" label="Stations" />
        <NavItem to="/managers" :icon="UserCog" label="Managers" />
        <NavItem to="/business-profile" :icon="Building2" label="Business Profile" />
      </div>

    </nav>

    <!-- User card -->
    <div class="px-3 py-3" style="border-top:1px solid var(--border)">
      <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-[var(--bg-3)] transition-colors">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold font-display text-[var(--text)] flex-shrink-0"
          style="background:linear-gradient(135deg,#f59e0b,#6366f1)">
          {{ initials }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="text-[13px] font-semibold text-[var(--text)] truncate">{{ auth.fullName }}</div>
          <div class="text-[11px] text-[var(--text-3)] capitalize">{{ auth.role }}</div>
        </div>
        <button @click="handleLogout" class="text-[var(--text-3)] hover:text-[#ef4444] transition-colors flex-shrink-0"
          title="Logout">
          <LogOut :size="16" />
        </button>
      </div>
    </div>
    

  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useStationsStore } from '@/stores/stations'
import { useSelectedStationStore } from '@/stores/selectedStation'
import NavItem from './NavItem.vue'

import {
  LayoutDashboard,
  Fuel,
  CirclePlus,
  Warehouse,
  Gauge,
  CreditCard,
  Receipt,
  Users,
  Clock3,
  BarChart3,
  Settings,
  UserCog,
  Building2,
  LogOut
} from 'lucide-vue-next'

const auth            = useAuthStore()
const ui              = useUiStore()
const stations        = useStationsStore()
const selectedStation = useSelectedStationStore()
const router = useRouter()

if (auth.isOwner) stations.fetchAll()

// Manager: the fuel station they're assigned to. Owner: whichever station
// is currently picked in the global topbar selector, or "All Stations".
const stationCaption = computed(() => {
  if (auth.isManager) return auth.user?.station?.name || 'No Station Assigned'

  if (selectedStation.selectedStationId) {
    const s = stations.records.find((s) => String(s.id) === String(selectedStation.selectedStationId))
    if (s) return s.name
  }
  return 'All Stations'
})

const initials = computed(() => {
  const n = auth.fullName || 'Admin'
  return n
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.nav-label {
  font-size: 9px;
  color: var(--text-3);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 6px 10px 3px;
}
</style>
