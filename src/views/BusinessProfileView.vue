<template>
  <div>
    <PageHeader title="Business Profile" subtitle="Your business name shown across the app" :crumbs="['Home','Business Profile']" />

    <div class="max-w-xl">
      <div class="card">
        <div class="card-header">
          <div class="font-display font-bold text-[15px] text-white">Business Details</div>
        </div>
        <div class="card-body space-y-4">
          <div>
            <label class="field-label">Business Name</label>
            <input v-model="form.business_name" class="form-input w-full" placeholder="Kailas Petromines" />
          </div>
          <div>
            <label class="field-label">Owner Full Name</label>
            <input v-model="form.name" class="form-input w-full" placeholder="Your name" />
          </div>
          <div>
            <label class="field-label">Email</label>
            <input v-model="form.email" type="email" class="form-input w-full" placeholder="you@example.com" />
          </div>

          <div class="flex justify-end pt-2">
            <button class="btn btn-primary px-8 flex items-center gap-1.5" @click="save" :disabled="saving">
              <RotateCw v-if="saving" :size="14" class="animate-spin" /><Save v-else :size="14" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import PageHeader from '@/components/ui/PageHeader.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { RotateCw, Save } from 'lucide-vue-next'

const auth = useAuthStore()
const ui   = useUiStore()

const saving = ref(false)
const form = reactive({ business_name: '', name: '', email: '' })

function loadFromAuth() {
  form.business_name = auth.user?.business_name || ''
  form.name  = auth.user?.name  || ''
  form.email = auth.user?.email || ''
}

onMounted(loadFromAuth)

async function save() {
  if (!form.business_name || !form.name || !form.email) {
    ui.error('All fields are required'); return
  }
  saving.value = true
  try {
    await auth.updateProfile({ business_name: form.business_name, name: form.name, email: form.email })
    ui.success('Business profile updated!')
  } catch (e) {
    ui.error(e?.message || 'Failed to update profile.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.field-label { display:block; font-size:11.5px; color:#8a9ab5; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:6px; }
</style>
