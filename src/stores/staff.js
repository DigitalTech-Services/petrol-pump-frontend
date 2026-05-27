import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { staffApi } from '@/services/api'

export const useStaffStore = defineStore('staff', () => {
  const list      = ref([])
  const advances  = ref([])
  const timesheet = ref([])
  const loading   = ref(false)

  const totalPayroll  = computed(() => list.value.reduce((a, s) => a + (s.workingSalary || 0), 0))
  const totalAdvances = computed(() => list.value.reduce((a, s) => a + (s.totalAdvance  || 0), 0))
  const totalPayout   = computed(() => list.value.reduce((a, s) => a + (s.finalPayout   || 0), 0))

  async function fetchAll(params = {}) {
    loading.value = true
    try {
      const [staff, adv, ts] = await Promise.all([
        staffApi.getAll(params),
        staffApi.getAdvances(params),
        staffApi.getTimesheet(params),
      ])
      list.value      = staff.data || staff
      advances.value  = adv.data   || adv
      timesheet.value = ts.data    || ts
    } finally { loading.value = false }
  }

  async function create(data) {
    const r = await staffApi.create(data)
    list.value.push(r.data || r)
    return r
  }

  async function update(id, data) {
    const r = await staffApi.update(id, data)
    const i = list.value.findIndex(s => s._id === id)
    if (i !== -1) list.value[i] = r.data || r
    return r
  }

  async function remove(id) {
    await staffApi.delete(id)
    list.value = list.value.filter(s => s._id !== id)
  }

  async function addAdvance(data) {
    const r = await staffApi.addAdvance(data)
    advances.value.push(r.data || r)
    return r
  }

  return { list, advances, timesheet, loading, totalPayroll, totalAdvances, totalPayout, fetchAll, create, update, remove, addAdvance }
})
