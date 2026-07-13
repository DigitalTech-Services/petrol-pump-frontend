import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stationApi } from '@/services/api'

function normalize(s) {
  return {
    id:          s.id,
    name:        s.name,
    dealerCode:  s.dealer_code,
    address:     s.address,
    city:        s.city,
    state:       s.state,
    gst:         s.gst,
    pan:         s.pan,
    phone:       s.phone,
    manager:     s.manager ?? null,
  }
}

export const useStationsStore = defineStore('stations', () => {
  const records = ref([])
  const loading = ref(false)
  const error   = ref(null)

  async function fetchAll() {
    loading.value = true
    error.value   = null
    try {
      const res     = await stationApi.getAll()
      const raw     = res?.data?.stations ?? []
      records.value = raw.map(normalize)
    } catch (e) {
      error.value = e?.message ?? 'Failed to load stations.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(data) {
    loading.value = true
    try {
      const res  = await stationApi.create(data)
      const flat = normalize(res?.data?.station ?? {})
      records.value.push(flat)
      return flat
    } catch (e) {
      error.value = e?.message ?? 'Failed to create station.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id, data) {
    loading.value = true
    try {
      const res  = await stationApi.update(id, data)
      const flat = normalize(res?.data?.station ?? {})
      const idx  = records.value.findIndex(r => r.id === id)
      if (idx !== -1) records.value[idx] = flat
      return flat
    } catch (e) {
      error.value = e?.message ?? 'Failed to update station.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id) {
    loading.value = true
    try {
      await stationApi.delete(id)
      records.value = records.value.filter(r => r.id !== id)
    } catch (e) {
      error.value = e?.message ?? 'Failed to delete station.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { records, loading, error, fetchAll, create, update, remove }
})
