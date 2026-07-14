import { defineStore } from 'pinia'
import { meterApi } from '@/services/api'

function normalizeReading(reading) {
  const nozzles = {}
  for (const nr of reading.nozzle_readings ?? []) {
    nozzles[nr.nozzle_id] = {
      opening: nr.opening,
      closing: nr.closing,
      used:    (nr.closing ?? 0) - (nr.opening ?? 0),
    }
  }
  return {
    id:      reading.id,
    date:    reading.date,
    total:   reading.total_used ?? 0,
    notes:   reading.notes ?? '',
    nozzles,
  }
}

function normalizeNozzle(n) {
  return {
    id:          n.id,
    nozzleId:    n.nozzle_id,
    pump:        n.pump,
    fuel:        n.fuel,
    active:      n.active,
    lastReading: n.last_reading,
  }
}

export const useMeterStore = defineStore('meter', {
  state: () => ({
    readings: [],
    nozzles:  [],
    loading:  false,
    error:    null,
  }),

  getters: {
    totalUsed: (s) => s.readings.reduce((a, r) => a + (r.total ?? 0), 0),
  },

  actions: {
    async fetchNozzles(stationId) {
      try {
        const res = await meterApi.getNozzles(stationId ? { station_id: stationId } : {})
        this.nozzles = (res.data?.nozzles ?? []).map(normalizeNozzle)
      } catch (e) {
        this.error = e?.message ?? 'Failed to load nozzles.'
        throw e
      }
    },

    async fetchReadings(month, stationId) {
      this.loading = true
      this.error   = null
      try {
        const res = await meterApi.getAll({
          ...(month ? { month } : {}),
          ...(stationId ? { station_id: stationId } : {}),
        })
        this.readings = (res.data?.readings ?? []).map(normalizeReading)
      } catch (e) {
        this.error = e?.message ?? 'Failed to load meter readings.'
        throw e
      } finally {
        this.loading = false
      }
    },

    buildPayload(form, nozzleIds) {
      return {
        date:  form.date,
        notes: form.notes ?? '',
        nozzle_readings: nozzleIds.map((id) => ({
          nozzle_id: id,
          opening:   form.nozzles[id]?.opening ?? 0,
          closing:   form.nozzles[id]?.closing ?? 0,
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
