<template>
  <div class="mb-3.5">
    <div class="flex justify-between text-[12px] mb-1.5">
      <span class="text-[#8a9ab5]">{{ label }}</span>
      <span :style="{ color }">{{ value }}</span>
    </div>
    <div class="fuel-bar-track">
      <div class="fuel-bar-fill" :style="{ width: pct + '%', background: color }" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  pct:   { type: Number, default: 0 },
  color: { type: String, default: '#f59e0b' },
})
</script>
