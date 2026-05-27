import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { salesApi } from '@/services/api'

export const useSalesStore = defineStore('sales', () => {
  const records  = ref([])
  const loading  = ref(false)
  const total    = ref(0)
  const filters  = ref({ month: '', year: new Date().getFullYear(), search: '' })

  const totals = computed(() => ({
    ms:       records.value.reduce((a, r) => a + (r.msVolume   || 0), 0),
    hsd:      records.value.reduce((a, r) => a + (r.hsdVolume  || 0), 0),
    speed:    records.value.reduce((a, r) => a + (r.speedVolume|| 0), 0),
    revenue:  records.value.reduce((a, r) => a + (r.revenue    || 0), 0),
    cash:     records.value.reduce((a, r) => a + (r.cash       || 0), 0),
    card:     records.value.reduce((a, r) => a + (r.card       || 0), 0),
    phonePe:  records.value.reduce((a, r) => a + (r.phonePe    || 0), 0),
    expenses: records.value.reduce((a, r) => a + (r.expenses   || 0), 0),
    credit:   records.value.reduce((a, r) => a + (r.creditSale || 0), 0),
  }))

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const res = await salesApi.getAll({ ...filters.value, ...params })
      records.value = res.data || res
      total.value   = res.total || records.value.length
    } finally { loading.value = false }
  }

  async function create(data) {
    const res = await salesApi.create(data)
    records.value.unshift(res.data || res)
    return res
  }

  async function update(id, data) {
    const res = await salesApi.update(id, data)
    const i = records.value.findIndex(r => r._id === id)
    if (i !== -1) records.value[i] = res.data || res
    return res
  }

  async function remove(id) {
    await salesApi.delete(id)
    records.value = records.value.filter(r => r._id !== id)
  }

  return { records, loading, total, filters, totals, fetchAll, create, update, remove }
})
