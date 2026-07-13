import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

// Owner-only global filter — which station's data every page should show.
// Empty string means "All Stations" (aggregate across every station the owner owns).
// Persisted so the choice survives a page reload, mirroring the auth store's pattern.
export const useSelectedStationStore = defineStore('selectedStation', () => {
  const selectedStationId = ref(localStorage.getItem('pm_selected_station') || '')

  watch(selectedStationId, (id) => {
    if (id) localStorage.setItem('pm_selected_station', id)
    else localStorage.removeItem('pm_selected_station')
  })

  function setStation(id) {
    selectedStationId.value = id
  }

  return { selectedStationId, setStation }
})
