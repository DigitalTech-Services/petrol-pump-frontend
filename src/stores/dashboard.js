import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '@/services/api'

export const useDashboardStore = defineStore('dashboard', () => {
  const kpis         = ref(null)
  const dailyTrend   = ref([])
  const fuelMix      = ref([])
  const stockLevels  = ref([])
  const paymentSplit = ref(null)
  const loading      = ref(false)
  const error        = ref(null)

  async function fetchAll(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const [k, trend, mix, stock, payment] = await Promise.all([
        dashboardApi.getKpis(params),
        dashboardApi.getDailyTrend(params),
        dashboardApi.getFuelMix(params),
        dashboardApi.getStockLevel(),
        dashboardApi.getPaymentSplit(params),
      ])
      // Each response shape: { status, success, message, data: <payload> }
      kpis.value         = k?.data         ?? null
      dailyTrend.value   = Array.isArray(trend?.data)   ? trend.data   : []
      fuelMix.value      = Array.isArray(mix?.data)     ? mix.data     : []
      stockLevels.value  = stock?.data      ?? []
      paymentSplit.value = payment?.data    ?? null
    } catch (e) {
      error.value = e?.message ?? 'Failed to load dashboard.'
    } finally {
      loading.value = false
    }
  }

  return { kpis, dailyTrend, fuelMix, stockLevels, paymentSplit, loading, error, fetchAll }
})
