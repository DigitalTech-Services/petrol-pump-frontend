import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stockApi } from '@/services/api'

export const useStockStore = defineStore('stock', () => {
  const records = ref([])
  const summary = ref(null)
  const loading = ref(false)

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const [recs, sum] = await Promise.all([
        stockApi.getAll(params),
        stockApi.getSummary(params),
      ])
      records.value = recs.data || recs
      summary.value = sum.data || sum
    } finally { loading.value = false }
  }

  async function create(data) {
    const r = await stockApi.create(data)
    records.value.unshift(r.data || r)
    return r
  }

  return { records, summary, loading, fetchAll, create }
})
