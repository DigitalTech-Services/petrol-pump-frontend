import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '@/services/api'

export const useDashboardStore = defineStore('dashboard', () => {
  const kpis         = ref(null)
  const dailyTrend   = ref([])
  const fuelMix      = ref([])
  const paymentSplit = ref(null)
  const stockLevels  = ref(null)
  const profitLoss   = ref(null)
  const actualProfit = ref(null)
  const loading      = ref(false)
  const error        = ref(null)

  async function fetchAll(params = {}) {
    // Clear stale data immediately so old period never bleeds into the new period's view
    kpis.value         = null
    dailyTrend.value   = []
    fuelMix.value      = []
    paymentSplit.value = null
    stockLevels.value  = null
    profitLoss.value   = null
    actualProfit.value = null
    loading.value      = true
    error.value        = null

    try {
      const res = await dashboardApi.getSummary(params)
      const d   = res?.data ?? {}
      kpis.value         = d.kpis                                    ?? null
      dailyTrend.value   = Array.isArray(d.daily_trend)  ? d.daily_trend  : []
      fuelMix.value      = Array.isArray(d.fuel_mix)     ? d.fuel_mix     : []
      paymentSplit.value = d.payment_split                            ?? null
      stockLevels.value  = d.stock_levels                             ?? null
      profitLoss.value   = d.profit_loss                              ?? null
      actualProfit.value = d.actual_profit                            ?? null
    } catch (e) {
      error.value = e?.message ?? 'Failed to load dashboard.'
    } finally {
      loading.value = false
    }
  }

  return { kpis, dailyTrend, fuelMix, paymentSplit, stockLevels, profitLoss, actualProfit, loading, error, fetchAll }
})
