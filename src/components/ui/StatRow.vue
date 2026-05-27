<template>
  <div class="flex rounded-[10px] overflow-hidden mb-6" style="border:1px solid #242d3e">
    <div
      v-for="(stat, i) in stats"
      :key="i"
      class="flex-1 px-5 py-4 min-w-0"
      style="background:#0f1218"
      :style="{ borderRight: i < stats.length - 1 ? '1px solid #242d3e' : 'none' }"
    >
      <div class="text-[10.5px] text-[#5a6a82] uppercase tracking-[0.08em] mb-1">{{ stat.label }}</div>
      <div class="font-display font-bold text-[24px] text-white leading-none" :class="stat.class">
        <span v-if="loading" class="skeleton h-7 w-20 block rounded" />
        <span v-else>{{ stat.value }}</span>
      </div>
      <div v-if="stat.sub" class="text-[11.5px] text-[#5a6a82] mt-1">{{ stat.sub }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  stats:   { type: Array, required: true },
  loading: { type: Boolean, default: false },
})
</script>
