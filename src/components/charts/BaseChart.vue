<template>
  <div class="chart-wrap" :style="{ height: height + 'px' }">
    <canvas ref="canvas" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

const props = defineProps({
  type:    { type: String, required: true },
  data:    { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
  height:  { type: Number, default: 260 },
})

const canvas = ref(null)
let chart = null

const GRID  = 'rgba(36,45,62,0.8)'
const TICK  = 'var(--text-3)'

function defaultOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    plugins: {
      legend: { labels: { color: TICK, font: { size: 11, family: 'DM Sans' }, padding: 16 } },
      tooltip: {
        backgroundColor: 'var(--bg-3)',
        borderColor: 'var(--border-2)',
        borderWidth: 1,
        titleColor: 'var(--text)',
        bodyColor: 'var(--text-2)',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: props.type !== 'doughnut' && props.type !== 'pie' ? {
      x: { grid: { color: GRID }, ticks: { color: TICK, font: { size: 10 }, maxRotation: 45 } },
      y: { grid: { color: GRID }, ticks: { color: TICK, font: { size: 10 } } },
    } : undefined,
  }
}

function mergeDeep(target, source) {
  const out = { ...target }
  for (const k of Object.keys(source)) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k]))
      out[k] = mergeDeep(target[k] || {}, source[k])
    else out[k] = source[k]
  }
  return out
}

function init() {
  if (!canvas.value) return
  if (chart) { chart.destroy(); chart = null }
  chart = new Chart(canvas.value, {
    type: props.type,
    data: props.data,
    options: mergeDeep(defaultOptions(), props.options),
  })
}

watch(() => props.data, () => {
  if (!chart) { init(); return }
  chart.data = props.data
  chart.update()
}, { deep: true })

onMounted(init)
onBeforeUnmount(() => { if (chart) chart.destroy() })
</script>
