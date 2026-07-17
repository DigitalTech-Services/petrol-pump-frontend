<template>
  <header
    class="flex items-center gap-4 px-6 flex-shrink-0"
    style="height:60px; background:var(--bg-2); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:30;"
  >
    <!-- Mobile menu toggle -->
    <button
      class="lg:hidden text-[var(--text-2)] hover:text-[var(--text)] transition-colors"
      @click="ui.toggleSidebar()"
    ><Menu :size="22" /></button>

    <!-- Breadcrumb / Page Title -->
    <div class="min-w-0">
      <h2 class="font-display font-bold text-[19px] text-[var(--text)] leading-none">{{ title }}</h2>
      <div class="text-[11px] text-[var(--text-3)] mt-0.5 hidden sm:block">{{ subtitle }}</div>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Right Actions -->
    <div class="flex items-center gap-3">

      <!-- New Entry CTA (manager only — owner is read-only) -->
      <RouterLink v-if="auth.isManager" to="/sales/new" class="btn btn-primary py-1.5 flex items-center gap-1.5">
        <Plus :size="14" /> New Entry
      </RouterLink>

      <!-- Global station filter (owner only) — applies to every page until changed -->
      <select v-else-if="auth.isOwner" v-model="selectedStation.selectedStationId"
        class="form-select text-[12px] py-1.5" style="min-width:160px">
        <option value="">All Stations</option>
        <option v-for="s in stations.records" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>

    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore }   from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useStationsStore } from '@/stores/stations'
import { useSelectedStationStore } from '@/stores/selectedStation'
import { Menu, Plus } from 'lucide-vue-next'

const route  = useRoute()
const ui     = useUiStore()
const auth   = useAuthStore()
const stations        = useStationsStore()
const selectedStation  = useSelectedStationStore()

if (auth.isOwner) stations.fetchAll()

const titles = {
  '/dashboard':    { title: 'Dashboard',          sub: 'Overview & KPIs' },
  '/sales':        { title: 'Petrol Sales',        sub: 'Daily sales records' },
  '/sales/new':    { title: 'New Sale Entry',      sub: 'Add daily sale' },
  '/stock':        { title: 'Stock Summary',       sub: 'Fuel inventory tracking' },
  '/meter':        { title: 'Meter Readings',      sub: 'Nozzle-wise meter data' },
  '/transactions': { title: 'Card Transactions',   sub: 'Bank transfers & PhonePe' },
  '/expenses':     { title: 'Expenses',            sub: 'Daily expense tracker' },
  '/staff':        { title: 'Staff & Salary',      sub: 'Payroll management' },
  '/timesheet':    { title: 'Time Sheet',          sub: 'Attendance & hours' },
  '/reports':      { title: 'Monthly Reports',     sub: 'Analytics & export' },
  '/settings':     { title: 'Settings',            sub: 'Station configuration' },
}

const title    = computed(() => titles[route.path]?.title    || route.meta?.title || 'Petromines')
const subtitle = computed(() => `${auth.stationName} · ${titles[route.path]?.sub || ''}`)
</script>
