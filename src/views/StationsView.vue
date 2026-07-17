<template>
  <div>
    <PageHeader title="Stations" subtitle="Fuel stations you own — assign a manager to each from the Managers page" :crumbs="['Home','Stations']">
      <template #actions>
        <button class="btn btn-primary flex items-center gap-1.5" @click="openAdd"><Plus :size="14" /> Add Station</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <KpiCard label="Total Stations" :value="store.records.length" :icon="Building2" color="#f59e0b" sub="Owned stations" />
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="font-display font-bold text-[15px] text-[var(--text)]">Stations</div>
          <div class="text-[11.5px] text-[var(--text-3)] mt-0.5">Each station is run by one manager at a time</div>
        </div>
      </div>

      <div v-if="store.loading" class="p-8 text-center text-[var(--text-3)] text-[13px]">Loading stations…</div>
      <div v-else-if="store.error" class="p-6 text-center text-red-400 text-[13px]">{{ store.error }}</div>

      <div v-else class="overflow-x-auto">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th><th>Name</th><th>City</th><th>GST</th><th>Manager</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="store.records.length === 0">
              <td colspan="6" class="text-center text-[var(--text-3)] py-6 text-[13px]">No stations yet. Add the first station.</td>
            </tr>
            <tr v-for="(s, i) in store.records" :key="s.id">
              <td class="font-mono-custom text-[11px] text-[var(--text-3)]">{{ i + 1 }}</td>
              <td class="text-[var(--text)] font-medium">{{ s.name }}</td>
              <td class="text-[var(--text-2)]">{{ s.city || '—' }}</td>
              <td class="font-mono-custom text-[12px]">{{ s.gst || '—' }}</td>
              <td>
                <span v-if="s.manager" class="text-[var(--text-2)]">{{ s.manager.name }}</span>
                <span v-else class="text-[11px] text-[var(--text-3)] italic">Unassigned</span>
              </td>
              <td>
                <div class="flex gap-1.5">
                  <button class="btn btn-ghost py-0.5 px-2 text-[11px]" @click="openEdit(s)"><Pencil :size="11" /></button>
                  <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDelete(s)"><Trash2 :size="11" /></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══ ADD MODAL ═══ -->
    <AppModal v-model="showAdd" title="Add Station" subtitle="Create a new fuel station" :icon="Building2" max-width="480px">
      <div class="space-y-4">
        <div><label class="field-label">Name *</label><input v-model="form.name" class="form-input w-full" placeholder="Station name" /></div>
        <div><label class="field-label">Dealer Code</label><input v-model="form.dealer_code" class="form-input w-full" /></div>
        <div><label class="field-label">Address</label><input v-model="form.address" class="form-input w-full" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="field-label">City</label><input v-model="form.city" class="form-input w-full" /></div>
          <div><label class="field-label">State</label><input v-model="form.state" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="field-label">GST</label><input v-model="form.gst" class="form-input w-full" /></div>
          <div><label class="field-label">PAN</label><input v-model="form.pan" class="form-input w-full" /></div>
        </div>
        <div><label class="field-label">Phone</label><input v-model="form.phone" class="form-input w-full" /></div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button class="btn btn-ghost px-6" @click="showAdd=false">Cancel</button>
          <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="saveAdd" :disabled="store.loading">
            <RotateCw v-if="store.loading" :size="14" class="animate-spin" /><Save v-else :size="14" /> Create Station
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ═══ EDIT MODAL ═══ -->
    <AppModal v-model="showEdit" title="Edit Station" :icon="Pencil" max-width="480px">
      <div class="space-y-4" v-if="editRow">
        <div><label class="field-label">Name</label><input v-model="editRow.name" class="form-input w-full" /></div>
        <div><label class="field-label">Dealer Code</label><input v-model="editRow.dealerCode" class="form-input w-full" /></div>
        <div><label class="field-label">Address</label><input v-model="editRow.address" class="form-input w-full" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="field-label">City</label><input v-model="editRow.city" class="form-input w-full" /></div>
          <div><label class="field-label">State</label><input v-model="editRow.state" class="form-input w-full" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="field-label">GST</label><input v-model="editRow.gst" class="form-input w-full" /></div>
          <div><label class="field-label">PAN</label><input v-model="editRow.pan" class="form-input w-full" /></div>
        </div>
        <div><label class="field-label">Phone</label><input v-model="editRow.phone" class="form-input w-full" /></div>
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
    <AppModal v-model="showDelete" title="Delete Station" :icon="AlertTriangle" max-width="420px">
      <div v-if="deleteTarget" class="text-center py-4">
        <Trash2 :size="48" class="mx-auto mb-4 text-[#ef4444] opacity-70" />
        <p class="text-[14px] text-[var(--text)] mb-2">
          Delete station <span class="text-[#f59e0b] font-bold">{{ deleteTarget.name }}</span>?
        </p>
        <p class="text-[12px] text-negative mt-3">Unassign its manager first — a station with an active manager can't be deleted.</p>
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
import { useStationsStore } from '@/stores/stations'
import { Plus, Building2, Pencil, Trash2, RotateCw, Save, AlertTriangle } from 'lucide-vue-next'

const ui    = useUiStore()
const store = useStationsStore()

onMounted(() => store.fetchAll().catch(() => {}))

// ── Add modal ────────────────────────────────────────────────────
const showAdd = ref(false)
const form = reactive({ name: '', dealer_code: '', address: '', city: '', state: '', gst: '', pan: '', phone: '' })

function openAdd() {
  form.name = form.dealer_code = form.address = form.city = form.state = form.gst = form.pan = form.phone = ''
  showAdd.value = true
}

async function saveAdd() {
  if (!form.name) {
    ui.error('Station name is required'); return
  }
  try {
    await store.create({ ...form })
    showAdd.value = false
    ui.success('Station created!')
  } catch (e) {
    ui.error(e?.message || 'Failed to create station.')
  }
}

// ── Edit modal ───────────────────────────────────────────────────
const showEdit = ref(false)
const editRow  = ref(null)

function openEdit(s) { editRow.value = { ...s }; showEdit.value = true }

async function saveEdit() {
  if (!editRow.value?.id) return
  try {
    await store.update(editRow.value.id, {
      name: editRow.value.name,
      dealer_code: editRow.value.dealerCode,
      address: editRow.value.address,
      city: editRow.value.city,
      state: editRow.value.state,
      gst: editRow.value.gst,
      pan: editRow.value.pan,
      phone: editRow.value.phone,
    })
    showEdit.value = false
    ui.success('Station updated!')
  } catch (e) {
    ui.error(e?.message || 'Failed to update station.')
  }
}

// ── Delete modal ─────────────────────────────────────────────────
const showDelete   = ref(false)
const deleteTarget = ref(null)

function openDelete(s) { deleteTarget.value = s; showDelete.value = true }

async function confirmDelete() {
  if (!deleteTarget.value?.id) return
  try {
    await store.remove(deleteTarget.value.id)
    showDelete.value = false
    ui.success('Station deleted!')
  } catch (e) {
    ui.error(e?.message || 'Failed to delete station.')
  }
}
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:var(--text-2); text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
</style>
