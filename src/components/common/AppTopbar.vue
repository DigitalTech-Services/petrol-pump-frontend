<template>
  <header
    class="flex items-center gap-4 px-6 flex-shrink-0"
    style="height:60px; background:#0f1218; border-bottom:1px solid #242d3e; position:sticky; top:0; z-index:30;"
  >
    <!-- Mobile menu toggle -->
    <button
      class="lg:hidden text-[#8a9ab5] hover:text-white transition-colors text-xl"
      @click="ui.toggleSidebar()"
    >☰</button>

    <!-- Breadcrumb / Page Title -->
    <div class="min-w-0">
      <h2 class="font-display font-bold text-[19px] text-white leading-none">{{ title }}</h2>
      <div class="text-[11px] text-[#5a6a82] mt-0.5 hidden sm:block">{{ subtitle }}</div>
    </div>

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Right Actions -->
    <div class="flex items-center gap-3">

      <!-- Live indicator -->
      <div class="hidden sm:flex items-center gap-2 text-[11px] text-[#5a6a82]">
        <span class="live-dot" />
        <span>Live</span>
      </div>

      <!-- Month Filter -->
      <select v-model="selectedMonth" class="form-select text-[12px] py-1.5 hidden md:block" style="min-width:140px">
        <option value="">All Months</option>
        <option v-for="m in months" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>

      <!-- Export -->
      <button class="btn btn-ghost py-1.5 hidden sm:flex">
        <span>📥</span> Export
      </button>

      <!-- New Entry CTA -->
      <RouterLink to="/sales/new" class="btn btn-primary py-1.5">
        <span>＋</span> New Entry
      </RouterLink>

    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore }   from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'

const route  = useRoute()
const ui     = useUiStore()
const auth   = useAuthStore()

const selectedMonth = ref('')

const months = [
  {value:'2026-04', label:'April 2026'},
  {value:'2026-03', label:'March 2026'},
  {value:'2026-02', label:'February 2026'},
  {value:'2026-01', label:'January 2026'},
]

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
