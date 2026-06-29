import { defineStore } from 'pinia'
import { meterApi } from '@/services/api'

// Maps frontend short keys (ms1, ms2 …) ↔ API nozzle IDs (MS-1, MS-2 …)
function toNozzleId(key) {
  // 'ms1' → 'MS-1', 'hsd1' → 'HSD-1', 'sp1' → 'SP-1'
  return key.toUpperCase().replace(/([A-Z]+)(\d)/, '$1-$2')
}

function fromNozzleId(id) {
  // 'MS-1' → 'ms1', 'HSD-1' → 'hsd1'
  return id.toLowerCase().replace('-', '')
}

function normalizeReading(reading) {
  const flat = {
    id:    reading.id,
    date:  reading.date,
    total: reading.total_used ?? 0,
    notes: reading.notes ?? '',
  }
  for (const nr of reading.nozzle_readings ?? []) {
    const key = fromNozzleId(nr.nozzle_id)
    flat[key + 'o'] = nr.opening
    flat[key + 'c'] = nr.closing
  }
  return flat
}

export const useMeterStore = defineStore('meter', {
  state: () => ({
    readings: [],
    loading:  false,
    error:    null,
  }),

  getters: {
    totalUsed: (s) => s.readings.reduce((a, r) => a + (r.total ?? 0), 0),
  },

  actions: {
    async fetchReadings(month) {
      this.loading = true
      this.error   = null
      try {
        const res = await meterApi.getAll(month ? { month } : {})
        this.readings = (res.data?.readings ?? []).map(normalizeReading)
      } catch (e) {
        this.error = e?.message ?? 'Failed to load meter readings.'
        throw e
      } finally {
        this.loading = false
      }
    },

    buildPayload(form, nozzleKeys) {
      return {
        date:  form.date,
        notes: form.notes ?? '',
        nozzle_readings: nozzleKeys.map((key) => ({
          nozzle_id: toNozzleId(key),
          opening:   form[key + 'o'] ?? 0,
          closing:   form[key + 'c'] ?? 0,
        })),
      }
    },

    async createReading(payload) {
      this.loading = true
      try {
        const res = await meterApi.create(payload)
        const flat = normalizeReading(res.data.reading)
        this.readings.push(flat)
        this.readings.sort((a, b) => a.date.localeCompare(b.date))
        return flat
      } catch (e) {
        this.error = e?.message ?? 'Failed to save meter reading.'
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateReading(id, payload) {
      this.loading = true
      try {
        const res = await meterApi.update(id, payload)
        const flat = normalizeReading(res.data.reading)
        const idx  = this.readings.findIndex((r) => r.id === id)
        if (idx !== -1) this.readings[idx] = flat
        return flat
      } catch (e) {
        this.error = e?.message ?? 'Failed to update meter reading.'
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteReading(id) {
      this.loading = true
      try {
        await meterApi.delete(id)
        this.readings = this.readings.filter((r) => r.id !== id)
      } catch (e) {
        this.error = e?.message ?? 'Failed to delete meter reading.'
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})
