import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { salesApi } from '@/services/api'

// API returns snake_case; views expect this flat shape
function normalize(sale) {
  return {
    id:        sale.id,
    date:      sale.date,
    shift:     sale.shift      ?? 'Full Day',
    ms:        sale.ms_volume  ?? 0,
    hsd:       sale.hsd_volume ?? 0,
    speed:     sale.speed_volume ?? 0,
    rateMS:    sale.rate_ms    ?? 0,
    rateHSD:   sale.rate_hsd   ?? 0,
    rateSpeed: sale.rate_speed ?? 0,
    revenue:   sale.revenue    ?? 0,
    cash:      sale.cash       ?? 0,
    card:      sale.card       ?? 0,
    phonepay:  sale.phone_pe   ?? 0,
    credit:    sale.credit_sale ?? 0,
    exp:       sale.expenses   ?? 0,
    balance:   sale.balance    ?? 0,
    narration: sale.narration  ?? '',
  }
}

// Convert any incoming form shape → snake_case API payload
// Handles both SaleEntryView (msVolume/phonePe) and SalesView (ms/phonepay) naming
function toPayload(data) {
  return {
    date:         data.saleDate    || data.date,
    shift:        data.shift       || 'Full Day',
    ms_volume:    data.msVolume    ?? data.ms       ?? 0,
    hsd_volume:   data.hsdVolume   ?? data.hsd      ?? 0,
    speed_volume: data.speedVolume ?? data.speed    ?? 0,
    rate_ms:      data.msRate      ?? data.rateMS   ?? 0,
    rate_hsd:     data.hsdRate     ?? data.rateHSD  ?? 0,
    rate_speed:   data.speedRate   ?? data.rateSpeed ?? 0,
    cash:         data.cash        ?? 0,
    card:         data.card        ?? 0,
    phone_pe:     data.phonePe     ?? data.phonepay ?? 0,
    credit_sale:  data.creditSale  ?? data.credit   ?? 0,
    expenses:     data.expenses    ?? data.exp      ?? 0,
    narration:    data.narration   ?? '',
  }
}

export const useSalesStore = defineStore('sales', () => {
  const records = ref([])
  const loading = ref(false)
  const error   = ref(null)

  const totals = computed(() => ({
    ms:       records.value.reduce((a, r) => a + (r.ms      || 0), 0),
    hsd:      records.value.reduce((a, r) => a + (r.hsd     || 0), 0),
    speed:    records.value.reduce((a, r) => a + (r.speed   || 0), 0),
    revenue:  records.value.reduce((a, r) => a + (r.revenue || 0), 0),
    cash:     records.value.reduce((a, r) => a + (r.cash    || 0), 0),
    card:     records.value.reduce((a, r) => a + (r.card    || 0), 0),
    phonepay: records.value.reduce((a, r) => a + (r.phonepay|| 0), 0),
    exp:      records.value.reduce((a, r) => a + (r.exp     || 0), 0),
    credit:   records.value.reduce((a, r) => a + (r.credit  || 0), 0),
  }))

  async function fetchAll(params = {}) {
    loading.value = true
    error.value   = null
    try {
      const res      = await salesApi.getAll(params)
      const raw      = res?.data?.sales ?? []
      records.value  = raw.map(normalize)
    } catch (e) {
      error.value = e?.message ?? 'Failed to load sales.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(formData) {
    loading.value = true
    try {
      const res  = await salesApi.create(toPayload(formData))
      const flat = normalize(res?.data?.sale ?? {})
      records.value.push(flat)
      records.value.sort((a, b) => a.date.localeCompare(b.date))
      return flat
    } catch (e) {
      error.value = e?.message ?? 'Failed to create sale.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id, formData) {
    loading.value = true
    try {
      const res  = await salesApi.update(id, toPayload(formData))
      const flat = normalize(res?.data?.sale ?? {})
      const idx  = records.value.findIndex(r => r.id === id)
      if (idx !== -1) records.value[idx] = flat
      return flat
    } catch (e) {
      error.value = e?.message ?? 'Failed to update sale.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id) {
    loading.value = true
    try {
      await salesApi.delete(id)
      records.value = records.value.filter(r => r.id !== id)
    } catch (e) {
      error.value = e?.message ?? 'Failed to delete sale.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { records, loading, error, totals, fetchAll, create, update, remove }
})
