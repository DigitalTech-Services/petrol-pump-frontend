import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '@/services/api'

export const useDashboardStore = defineStore('dashboard', () => {
  const kpis        = ref(null)
  const dailyTrend  = ref([])
  const fuelMix     = ref([])
  const stockLevels = ref([])
  const paymentSplit= ref(null)
  const loading     = ref(false)
  const error       = ref(null)

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
      kpis.value         = k.data || k
      dailyTrend.value   = trend.data || trend
      fuelMix.value      = mix.data || mix
      stockLevels.value  = stock.data || stock
      paymentSplit.value = payment.data || payment
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return { kpis, dailyTrend, fuelMix, stockLevels, paymentSplit, loading, error, fetchAll }
})
