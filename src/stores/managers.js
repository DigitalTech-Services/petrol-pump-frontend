import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '@/services/api'

function normalize(u) {
  return {
    id:        u.id,
    name:      u.name,
    email:     u.email,
    contact:   u.contact,
    createdAt: u.created_at,
  }
}

export const useManagersStore = defineStore('managers', () => {
  const records = ref([])
  const loading = ref(false)
  const error   = ref(null)

  async function fetchAll() {
    loading.value = true
    error.value   = null
    try {
      const res     = await userApi.getSubUsers()
      const raw     = res?.data?.sub_users ?? []
      records.value = raw.map(normalize)
    } catch (e) {
      error.value = e?.message ?? 'Failed to load managers.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(data) {
    loading.value = true
    try {
      const res  = await userApi.addSubUser(data)
      const flat = normalize(res?.data?.sub_user ?? {})
      records.value.push(flat)
      return flat
    } catch (e) {
      error.value = e?.message ?? 'Failed to create manager.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function update(id, data) {
    loading.value = true
    try {
      const res  = await userApi.updateSubUser({ user_id: id, ...data })
      const flat = normalize(res?.data?.sub_user ?? {})
      const idx  = records.value.findIndex(r => r.id === id)
      if (idx !== -1) records.value[idx] = flat
      return flat
    } catch (e) {
      error.value = e?.message ?? 'Failed to update manager.'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id) {
    loading.value = true
    try {
      await userApi.deleteSubUser({ user_id: id })
      records.value = records.value.filter(r => r.id !== id)
    } catch (e) {
      error.value = e?.message ?? 'Failed to delete manager.'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { records, loading, error, fetchAll, create, update, remove }
})
