<template>
  <div>
    <PageHeader title="Meter Readings" subtitle="Nozzle-wise opening & closing meters" :crumbs="['Home','Meter']">
      <template #actions>
        <button class="btn btn-ghost">📥 Export</button>
        <button class="btn btn-primary">＋ Add Reading</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="MS Nozzles"    value="6 Active"       icon="🔴" color="#f59e0b" sub="MS-1 to MS-6" />
      <KpiCard label="HSD Nozzles"   value="4 Active"       icon="🟢" color="#10b981" sub="HSD-1 to HSD-4" />
      <KpiCard label="Speed Nozzles" value="4 Active"       icon="🔵" color="#3b82f6" sub="SP-1 to SP-4" />
      <KpiCard label="Total MS Used" value="1,23,952 L"     icon="📊" color="#6366f1" sub="All nozzles" />
    </div>

    <div class="card">
      <div class="card-header">
        <div class="font-display font-bold text-[15px] text-white">MS Nozzle Meter — Opening & Closing</div>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>MS-1 Open</th><th>MS-1 Close</th><th>MS-1 Used</th>
              <th>MS-2 Open</th><th>MS-2 Close</th><th>MS-2 Used</th>
              <th>MS-3 Open</th><th>MS-3 Close</th><th>MS-3 Used</th>
              <th>Day Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in meterData" :key="r.date">
              <td><span class="font-mono-custom text-[12px] text-[#f59e0b]">{{ r.date }}</span></td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms1o }}</td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms1c }}</td>
              <td><span class="badge badge-ms">{{ fmt(r.ms1c - r.ms1o) }}</span></td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms2o }}</td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms2c }}</td>
              <td><span class="badge badge-ms">{{ fmt(r.ms2c - r.ms2o) }}</span></td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms3o }}</td>
              <td class="font-mono-custom text-[11.5px]">{{ r.ms3c }}</td>
              <td><span class="badge badge-ms">{{ fmt(r.ms3c - r.ms3o) }}</span></td>
              <td class="amt text-[#f59e0b] font-bold">{{ fmt(r.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import { fmt }    from '@/utils/format'

const meterData = [
  {date:'01 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:253427.84,ms2c:254118.90,ms3o:336102.26,ms3c:337120.24,total:3130.11},
  {date:'02 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:254118.90,ms2c:254633.36,ms3o:337120.24,ms3c:338229.55,total:3202.38},
  {date:'03 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:254633.36,ms2c:255516.83,ms3o:338229.55,ms3c:339049.72,total:3729.09},
  {date:'04 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:255516.83,ms2c:255709.61,ms3o:339049.72,ms3c:340078.13,total:3589.91},
  {date:'05 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:255709.61,ms2c:256335.81,ms3o:340078.13,ms3c:340859.01,total:3634.32},
  {date:'06 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:256335.81,ms2c:256926.46,ms3o:340859.01,ms3c:342292.00,total:3959.95},
  {date:'07 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:256926.46,ms2c:257714.74,ms3o:342292.00,ms3c:343710.92,total:3933.40},
  {date:'08 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:257714.74,ms2c:258378.23,ms3o:343710.92,ms3c:345278.61,total:3861.98},
  {date:'09 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:258378.23,ms2c:258980.45,ms3o:345278.61,ms3c:346784.65,total:4160.60},
  {date:'10 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:258980.45,ms2c:259772.00,ms3o:346784.65,ms3c:347842.03,total:4082.55},
  {date:'11 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:259772.00,ms2c:260267.82,ms3o:347842.03,ms3c:349121.91,total:4057.09},
  {date:'12 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:260267.82,ms2c:261338.09,ms3o:349121.91,ms3c:351014.65,total:4476.28},
  {date:'13 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:261338.09,ms2c:262632.79,ms3o:351014.65,ms3c:352222.93,total:4439.22},
  {date:'14 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:262632.79,ms2c:264376.02,ms3o:352222.93,ms3c:353208.66,total:3834.12},
  {date:'15 Apr',ms1o:101181.38,ms1c:101181.38,ms2o:264376.02,ms2c:265422.57,ms3o:353208.66,ms3c:354926.72,total:4841.00},
]
</script>
