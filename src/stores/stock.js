import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stockApi } from '@/services/api'

function normalize(entry) {
  return {
    id:        entry.id,
    date:      entry.date,
    fuelType:  entry.fuel_type,
    open:      entry.open ?? 0,
    recv:      entry.recv ?? 0,
    net:       entry.net  ?? 0,
    close:     entry.close ?? 0,
    sale:      entry.sale ?? 0,
    var:       entry.variation ?? 0,
    remarks:   entry.remarks ?? '',
  }
}

function toPayload(data) {
  return {
    date:        data.date,
    fuel_type:   data.fuelType,
    opening:     data.open ?? 0,
    received:    data.recv ?? 0,
    closing:     data.close ?? 0,
    actual_sale: data.sale ?? null,
    remarks:     data.remarks ?? '',
  }
}

export const useStockStore = defineStore('stock', () => {
  const records  = ref([])
  const summary  = ref(null)
  const tankwise = ref(null)
  const loading  = ref(false)
  const error    = ref(null)

  async function fetchAll(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const res     = await stockApi.getAll(params)
      const raw     = res?.data?.entries ?? []
      records.value = raw.map(normalize)
    } catch (e) {
      error.value = e?.message ?? 'Failed to load stock entries.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchSummary(params = {}) {
    try {
      const res = await stockApi.getSummary(params)
      summary.value = res?.data?.summary ?? null
    } catch (e) {
      error.value = e?.message ?? 'Failed to load stock summary.'
      throw e
    }
  }

  async function fetchTankwise(params = {}) {
    try {
      const res = await stockApi.getTankwise(params)
      tankwise.value = res?.data?.tankwise ?? null
    } catch (e) {
      error.value = e?.message ?? 'Failed to load tankwise stock.'
      throw e
    }
  }

  async function create(formData) {
    loading.value = true
    try {
      const res  = await stockApi.create(toPayload(formData))
      const flat = normalize(res?.data?.entry ?? {})
      records.value.push(flat)
      records.value.sort((a, b) => a.date.localeCompare(b.date))
      return flat
    } catch (e) {
      error.value = e?.message ?? 'Failed to create stock entry.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id, formData) {
    loading.value = true
    try {
      const res  = await stockApi.update(id, toPayload(formData))
      const flat = normalize(res?.data?.entry ?? {})
      const idx  = records.value.findIndex(r => r.id === id)
      if (idx !== -1) records.value[idx] = flat
      return flat
    } catch (e) {
      error.value = e?.message ?? 'Failed to update stock entry.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id) {
    loading.value = true
    try {
      await stockApi.delete(id)
      records.value = records.value.filter(r => r.id !== id)
    } catch (e) {
      error.value = e?.message ?? 'Failed to delete stock entry.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { records, summary, tankwise, loading, error, fetchAll, fetchSummary, fetchTankwise, create, update, remove }
})
