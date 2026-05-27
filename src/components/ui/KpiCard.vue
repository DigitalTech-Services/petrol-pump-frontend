<template>
  <div class="kpi-card" :style="{ '--kpi-accent': color }">
    <div class="text-[11px] text-[#5a6a82] uppercase tracking-[0.08em] mb-2">{{ label }}</div>
    <div class="font-display font-bold text-white leading-none mb-1.5" :style="{ fontSize: valueSize }">
      <template v-if="loading">
        <div class="skeleton h-8 w-24" />
      </template>
      <template v-else>{{ value }}</template>
    </div>
    <div class="text-[11.5px] text-[#8a9ab5]">
      <span v-if="trend > 0" class="text-[#10b981]">↑ {{ trend }}%</span>
      <span v-else-if="trend < 0" class="text-[#ef4444]">↓ {{ Math.abs(trend) }}%</span>
      <span v-if="sub"> {{ sub }}</span>
    </div>
    <div v-if="icon" class="absolute right-4 top-4 text-[28px] opacity-10 pointer-events-none">{{ icon }}</div>
  </div>
</template>

<script setup>
defineProps({
  label:     { type: String, required: true },
  value:     { type: [String, Number], default: '—' },
  sub:       { type: String, default: '' },
  trend:     { type: Number, default: null },
  color:     { type: String, default: '#f59e0b' },
  icon:      { type: String, default: '' },
  loading:   { type: Boolean, default: false },
  valueSize: { type: String, default: '26px' },
})
</script>
