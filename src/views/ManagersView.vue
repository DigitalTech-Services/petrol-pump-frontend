<template>
  <div>
    <PageHeader title="Managers" subtitle="Manager accounts — each runs one assigned station" :crumbs="['Home','Managers']">
      <template #actions>
        <button class="btn btn-primary flex items-center gap-1.5" @click="openAdd"><Plus :size="14" /> Add Manager</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Managers" :value="store.records.length" :icon="Users" color="#f59e0b" sub="Active accounts" />
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="font-display font-bold text-[15px] text-white">Manager Accounts</div>
          <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Each manager logs in separately and only sees the sales, stock, staff and settings of their assigned station</div>
        </div>
      </div>

      <div v-if="store.loading" class="p-8 text-center text-[#5a6a82] text-[13px]">Loading managers…</div>
      <div v-else-if="store.error" class="p-6 text-center text-red-400 text-[13px]">{{ store.error }}</div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>Email</th><th>Contact</th><th>Station</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.records.length === 0">
              <td colspan="6" class="text-center text-[#5a6a82] py-6 text-[13px]">No managers yet. Add the first manager account.</td>
            </tr>
            <tr v-for="(m, i) in store.records" :key="m.id">
              <td class="font-mono-custom text-[11px] text-[#5a6a82]">{{ i + 1 }}</td>
              <td class="text-white font-medium">{{ m.name }}</td>
              <td class="text-[#8a9ab5]">{{ m.email }}</td>
              <td class="font-mono-custom text-[12px]">{{ m.contact }}</td>
              <td>
                <span v-if="m.stationName" class="text-[#8a9ab5]">{{ m.stationName }}</span>
                <span v-else class="text-[11px] text-[#5a6a82] italic">Unassigned</span>
              </td>
              <td>
                <div class="flex gap-1.5">
                  <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEdit(m)"><Pencil :size="11" /></button>
                  <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDelete(m)"><Trash2 :size="11" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══ ADD MODAL ═══ -->
    <AppModal v-model="showAdd" title="Add Manager" subtitle="Create a new manager login" :icon="UserPlus" max-width="480px">
      <div class="space-y-4">
        <div><label class="field-label">Name *</label><input v-model="form.name" class="form-input w-full" placeholder="Full name" /></div>
        <div><label class="field-label">Email *</label><input type="email" v-model="form.email" class="form-input w-full" placeholder="manager@example.com" /></div>
        <div><label class="field-label">Contact *</label><input v-model="form.contact" class="form-input w-full" placeholder="10-digit phone" /></div>
        <div><label class="field-label">Password *</label><input type="password" v-model="form.password" class="form-input w-full" placeholder="Min 8 characters" /></div>
        <div>
          <label class="field-label">Station</label>
          <select v-model="form.station_id" class="form-select w-full">
            <option value="">Unassigned</option>
            <option v-for="s in stations.records" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAdd=false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveAdd" :disabled="store.loading">
            <RotateCw v-if="store.loading" :size="14" class="animate-spin" /><Save v-else :size="14" /> Create Manager
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Manager" :icon="Pencil" max-width="480px">
      <div class="space-y-4" v-if="editRow">
        <div><label class="field-label">Name</label><input v-model="editRow.name" class="form-input w-full" /></div>
        <div><label class="field-label">Email</label><input type="email" v-model="editRow.email" class="form-input w-full" /></div>
        <div>
          <label class="field-label">Station</label>
          <select v-model="editRow.stationId" class="form-select w-full">
            <option value="">Unassigned</option>
            <option v-for="s in stations.records" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showEdit=false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveEdit" :disabled="store.loading">
            <RotateCw v-if="store.loading" :size="14" class="animate-spin" /><Save v-else :size="14" /> Update
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ DELETE CONFIRM ═══ -->
    <AppModal v-model="showDelete" title="Delete Manager" :icon="AlertTriangle" max-width="420px">
      <div v-if="deleteTarget" class="text-center py-4">
        <Trash2 :size="48" class="mx-auto mb-4 text-[#ef4444] opacity-70" />
        <p class="text-[14px] text-[#e8edf5] mb-2">
          Delete manager <span class="text-[#f59e0b] font-bold">{{ deleteTarget.name }}</span>?
        </p>
        <p class="text-[12px] text-negative mt-3">Their login will stop working. Their existing records are kept.</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showDelete=false">Cancel</button>
          <button class="btn btn-danger px-8 flex items-center gap-1.5" @click="confirmDelete" :disabled="store.loading">
            <RotateCw v-if="store.loading" :size="14" class="animate-spin" /><Trash2 v-else :size="14" /> Delete
          </button>
        </div>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import KpiCard    from '@/components/ui/KpiCard.vue'
import AppModal   from '@/components/ui/AppModal.vue'
import { useUiStore } from '@/stores/ui'
import { useManagersStore } from '@/stores/managers'
import { useStationsStore } from '@/stores/stations'
import { Plus, Users, Pencil, Trash2, UserPlus, RotateCw, Save, AlertTriangle } from 'lucide-vue-next'

const ui       = useUiStore()
const store    = useManagersStore()
const stations = useStationsStore()

onMounted(() => {
  store.fetchAll().catch(() => {})
  stations.fetchAll().catch(() => {})
})

// ── Add modal ────────────────────────────────────────────────────
const showAdd = ref(false)
const form = reactive({ name: '', email: '', contact: '', password: '', station_id: '' })

function openAdd() {
  form.name = form.email = form.contact = form.password = form.station_id = ''
  showAdd.value = true
}

async function saveAdd() {
  if (!form.name || !form.email || !form.contact || !form.password) {
    ui.error('All fields are required'); return
  }
  try {
    await store.create({ ...form, station_id: form.station_id || null })
    showAdd.value = false
    ui.success('Manager created!')
  } catch (e) {
    ui.error(e?.message || 'Failed to create manager.')
  }
}

// ── Edit modal ───────────────────────────────────────────────────
const showEdit = ref(false)
const editRow  = ref(null)

function openEdit(m) { editRow.value = { ...m }; showEdit.value = true }

async function saveEdit() {
  if (!editRow.value?.id) return
  try {
    await store.update(editRow.value.id, {
      name: editRow.value.name,
      email: editRow.value.email,
      station_id: editRow.value.stationId || null,
    })
    showEdit.value = false
    ui.success('Manager updated!')
  } catch (e) {
    ui.error(e?.message || 'Failed to update manager.')
  }
}

// ── Delete modal ─────────────────────────────────────────────────
const showDelete   = ref(false)
const deleteTarget = ref(null)

function openDelete(m) { deleteTarget.value = m; showDelete.value = true }

async function confirmDelete() {
  if (!deleteTarget.value?.id) return
  try {
    await store.remove(deleteTarget.value.id)
    showDelete.value = false
    ui.success('Manager deleted!')
  } catch (e) {
    ui.error(e?.message || 'Failed to delete manager.')
  }
}
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:#8a9ab5; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
</style>
