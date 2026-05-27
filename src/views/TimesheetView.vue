<template>
  <div>
    <PageHeader title="Time Sheet" subtitle="Staff attendance & working hours — April 2026" :crumbs="['Home','Time Sheet']">
      <template #actions>
        <button class="btn btn-ghost">📥 Export Sheet</button>
        <button class="btn btn-primary">＋ Mark Attendance</button>
      </template>
    </PageHeader>

    <!-- KPI Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Staff"       value="13"          icon="👥" color="#f59e0b" sub="Active this month" />
      <KpiCard label="Total Man-Days"    value="302"         icon="📅" color="#10b981" sub="Combined attendance" />
      <KpiCard label="Avg Days/Person"   value="23.2"        icon="📊" color="#3b82f6" sub="30 day month" />
      <KpiCard label="Full Attendance"   value="4 Staff"     icon="🏆" color="#6366f1" sub="30/30 days" />
    </div>

    <!-- Summary Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div
        v-for="s in timesheetData" :key="s.name"
        class="rounded-xl p-5 transition-all duration-200 hover:-translate-y-1"
        style="background:#0f1218; border:1px solid #242d3e;"
      >
        <!-- Header -->
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-[14px] text-white flex-shrink-0"
            :style="{ background: s.color }">
            {{ s.name.slice(0, 2).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-display font-bold text-[15px] text-white">{{ s.name }}</div>
            <div class="text-[11.5px] text-[#5a6a82]">{{ s.role }}</div>
          </div>
          <div class="text-right">
            <div class="font-display font-bold text-[22px]" :style="{ color: s.color }">{{ s.daysWorked }}</div>
            <div class="text-[10px] text-[#5a6a82]">/ 30 days</div>
          </div>
        </div>

        <!-- Attendance Bar -->
        <div class="mb-4">
          <div class="fuel-bar-track">
            <div class="fuel-bar-fill" :style="{ width: (s.daysWorked / 30 * 100) + '%', background: s.color }" />
          </div>
          <div class="flex justify-between text-[10.5px] text-[#5a6a82] mt-1">
            <span>{{ Math.round(s.daysWorked / 30 * 100) }}% attendance</span>
            <span>{{ 30 - s.daysWorked }} days absent</span>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="grid grid-cols-3 gap-2 pt-3" style="border-top:1px solid #1c2230">
          <div class="text-center">
            <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Shift</div>
            <div class="font-display font-bold text-[13px] text-white">{{ s.shift }}h</div>
          </div>
          <div class="text-center">
            <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Rate/Day</div>
            <div class="font-display font-bold text-[13px] text-[#f59e0b]">₹{{ s.ratePerDay }}</div>
          </div>
          <div class="text-center">
            <div class="text-[9.5px] text-[#5a6a82] uppercase tracking-wide mb-1">Salary</div>
            <div class="font-display font-bold text-[13px] text-[#10b981]">₹{{ fmtK(s.salary) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Full Register Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="font-display font-bold text-[15px] text-white">Attendance Register — April 2026</div>
          <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Complete shift & salary register</div>
        </div>
        <div class="ml-auto">
          <button class="btn btn-ghost text-[12px]">🖨 Print</button>
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee</th>
              <th>Role</th>
              <th>Days Present</th>
              <th>Days Absent</th>
              <th>Shift (hrs)</th>
              <th>Rate / Day</th>
              <th>Gross Salary</th>
              <th>Advance</th>
              <th>Net Payable</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in timesheetData" :key="s.name">
              <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i + 1 }}</td>
              <td>
                <div class="flex items-center gap-2.5">
                  <div class="w-7 h-7 rounded-full flex items-center justify-center font-display font-bold text-[11px] text-white flex-shrink-0"
                    :style="{ background: s.color }">{{ s.name.slice(0, 2).toUpperCase() }}</div>
                  <span class="font-medium text-white">{{ s.name }}</span>
                </div>
              </td>
              <td><span class="badge badge-gray text-[11px]">{{ s.role }}</span></td>
              <td>
                <span class="font-display font-bold text-[15px] text-[#10b981]">{{ s.daysWorked }}</span>
                <span class="text-[#5a6a82] text-[11px]"> days</span>
              </td>
              <td>
                <span class="font-display font-bold text-[15px]" :class="(30 - s.daysWorked) > 5 ? 'text-negative' : 'text-[#5a6a82]'">
                  {{ 30 - s.daysWorked }}
                </span>
              </td>
              <td class="amt text-[#8a9ab5]">{{ s.shift }}h</td>
              <td class="amt text-[#8a9ab5]">₹{{ s.ratePerDay }}</td>
              <td class="amt text-positive font-semibold">₹{{ fmt(s.salary) }}</td>
              <td class="amt text-negative">{{ s.advance > 0 ? '₹' + fmt(s.advance) : '—' }}</td>
              <td>
                <span class="font-display font-bold text-[15px]"
                  :class="s.netPayable < 0 ? 'text-negative' : 'text-[#f59e0b]'">
                  ₹{{ fmt(s.netPayable) }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="flex-1 fuel-bar-track" style="min-width:50px">
                    <div class="fuel-bar-fill" :style="{ width: (s.daysWorked / 30 * 100) + '%', background: s.color }" />
                  </div>
                  <span class="text-[11px] text-[#8a9ab5]">{{ Math.round(s.daysWorked / 30 * 100) }}%</span>
                </div>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">TOTAL (13 employees)</td>
              <td>{{ timesheetData.reduce((a, s) => a + s.daysWorked, 0) }} days</td>
              <td>{{ timesheetData.reduce((a, s) => a + (30 - s.daysWorked), 0) }}</td>
              <td>—</td>
              <td>—</td>
              <td>₹{{ fmt(timesheetData.reduce((a, s) => a + s.salary, 0)) }}</td>
              <td>₹{{ fmt(timesheetData.reduce((a, s) => a + s.advance, 0)) }}</td>
              <td>₹{{ fmt(timesheetData.reduce((a, s) => a + s.netPayable, 0)) }}</td>
              <td>—</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import { fmt }    from '@/utils/format'

const fmtK = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(n)

const timesheetData = [
  { name:'Ajay',     role:'Senior Staff', daysWorked:30, shift:12, ratePerDay:500, salary:15000, advance:6880,  netPayable:8120,  color:'#f59e0b' },
  { name:'Santosh',  role:'Senior Staff', daysWorked:27, shift:14, ratePerDay:800, salary:21600, advance:25719, netPayable:-4119, color:'#ef4444' },
  { name:'Ayaz',     role:'Staff',        daysWorked:30, shift:8,  ratePerDay:400, salary:12000, advance:1094,  netPayable:10906, color:'#10b981' },
  { name:'Rizwan',   role:'Staff',        daysWorked:30, shift:8,  ratePerDay:400, salary:12000, advance:1517,  netPayable:10483, color:'#3b82f6' },
  { name:'Rehan',    role:'Part-time',    daysWorked:8,  shift:10, ratePerDay:458, salary:3666,  advance:656,   netPayable:3010,  color:'#8b5cf6' },
  { name:'Kartik',   role:'Staff',        daysWorked:26, shift:10, ratePerDay:410, salary:10666, advance:2415,  netPayable:8251,  color:'#06b6d4' },
  { name:'Komal',    role:'Staff',        daysWorked:20, shift:8,  ratePerDay:333, salary:6666,  advance:725,   netPayable:5941,  color:'#f97316' },
  { name:'Tanmay',   role:'Staff',        daysWorked:15, shift:8,  ratePerDay:316, salary:4750,  advance:574,   netPayable:4176,  color:'#84cc16' },
  { name:'Vanshika', role:'Staff',        daysWorked:16, shift:8,  ratePerDay:316, salary:5066,  advance:630,   netPayable:4436,  color:'#ec4899' },
  { name:'Sahil P',  role:'Petrol',       daysWorked:6,  shift:8,  ratePerDay:366, salary:2200,  advance:675,   netPayable:1525,  color:'#f59e0b' },
  { name:'Sahil A',  role:'Air Machine',  daysWorked:24, shift:12, ratePerDay:400, salary:9600,  advance:0,     netPayable:9600,  color:'#14b8a6' },
  { name:'Shaikh',   role:'Manager',      daysWorked:30, shift:12, ratePerDay:833, salary:25000, advance:0,     netPayable:25000, color:'#6366f1' },
  { name:'Dhanu',    role:'Security',     daysWorked:30, shift:12, ratePerDay:500, salary:15000, advance:0,     netPayable:15000, color:'#78716c' },
]
</script>
