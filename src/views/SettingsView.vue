<template>
  <div>
    <PageHeader title="Settings" subtitle="Station configuration & system preferences" :crumbs="['Home','Settings']">
      <template #actions>
        <button class="btn btn-primary" @click="saveAll">💾 Save Changes</button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-5">
      <!-- Sidebar Nav -->
      <div class="lg:col-span-1">
        <div class="card p-2">
          <button
            v-for="s in sections" :key="s.key"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left mb-1 transition-all duration-150 text-[13.5px]"
            :class="activeSection === s.key
              ? 'bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[rgba(245,158,11,0.2)]'
              : 'text-[#8a9ab5] hover:bg-[#161b24] hover:text-white'"
            @click="activeSection = s.key"
          >
            <span class="text-base w-5 text-center flex-shrink-0">{{ s.icon }}</span>
            <span class="font-medium">{{ s.label }}</span>
          </button>
        </div>
      </div>

      <!-- Content Panel -->
      <div class="lg:col-span-3 space-y-5">

        <!-- Station Details -->
        <template v-if="activeSection === 'station'">
          <div class="card">
            <div class="card-header">
              <span class="text-lg">🏪</span>
              <div><div class="font-display font-bold text-[15px] text-white">Station Details</div><div class="text-[11.5px] text-[#5a6a82] mt-0.5">Basic information about your fuel station</div></div>
            </div>
            <div class="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label class="field-label">Station Name</label><input v-model="settings.stationName" class="form-input w-full" /></div>
              <div><label class="field-label">HP Dealer Code</label><input v-model="settings.dealerCode" class="form-input w-full" /></div>
              <div><label class="field-label">Owner Name</label><input v-model="settings.ownerName" class="form-input w-full" /></div>
              <div><label class="field-label">Contact Number</label><input v-model="settings.phone" class="form-input w-full" /></div>
              <div class="sm:col-span-2"><label class="field-label">Address</label><textarea v-model="settings.address" class="form-input w-full" rows="2" /></div>
              <div><label class="field-label">City</label><input v-model="settings.city" class="form-input w-full" /></div>
              <div><label class="field-label">State</label><input v-model="settings.state" class="form-input w-full" /></div>
              <div><label class="field-label">GST Number</label><input v-model="settings.gst" class="form-input w-full" /></div>
              <div><label class="field-label">PAN Number</label><input v-model="settings.pan" class="form-input w-full" /></div>
            </div>
          </div>
        </template>

        <!-- Fuel Rates -->
        <template v-if="activeSection === 'fuel'">
          <div class="card">
            <div class="card-header">
              <span class="text-lg">⛽</span>
              <div><div class="font-display font-bold text-[15px] text-white">Fuel Rates</div><div class="text-[11.5px] text-[#5a6a82] mt-0.5">Current fuel prices (auto-affects revenue calculations)</div></div>
              <span class="ml-auto badge badge-green">Live Rates</span>
            </div>
            <div class="card-body space-y-5">
              <div v-for="fuel in fuelRates" :key="fuel.key"
                class="p-4 rounded-xl" style="background:#161b24; border:1px solid #1c2230">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold text-[13px] text-white"
                    :style="{ background: fuel.color }">{{ fuel.abbr }}</div>
                  <div>
                    <div class="font-display font-bold text-[15px] text-white">{{ fuel.name }}</div>
                    <div class="text-[11px] text-[#5a6a82]">{{ fuel.type }}</div>
                  </div>
                  <div class="ml-auto">
                    <span class="font-display font-bold text-[22px]" :style="{ color: fuel.color }">₹{{ fuel.rate }}</span>
                    <span class="text-[11px] text-[#5a6a82]">/L</span>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div><label class="field-label">Current Rate (₹/L)</label>
                    <input type="number" step="0.01" v-model="fuel.rate" class="form-input w-full" /></div>
                  <div><label class="field-label">Effective Date</label>
                    <input type="date" v-model="fuel.effectiveDate" class="form-input w-full" /></div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Nozzle Config -->
        <template v-if="activeSection === 'nozzles'">
          <div class="card">
            <div class="card-header">
              <span class="text-lg">🔧</span>
              <div><div class="font-display font-bold text-[15px] text-white">Nozzle Configuration</div><div class="text-[11.5px] text-[#5a6a82] mt-0.5">Pump and nozzle assignments</div></div>
              <button class="btn btn-primary ml-auto text-[12px] py-1">＋ Add Nozzle</button>
            </div>
            <div class="overflow-x-auto">
              <table class="data-table">
                <thead><tr><th>Nozzle ID</th><th>Pump</th><th>Fuel Type</th><th>Status</th><th>Last Reading</th></tr></thead>
                <tbody>
                  <tr v-for="n in nozzles" :key="n.id">
                    <td class="font-mono-custom text-[#f59e0b]">{{ n.id }}</td>
                    <td>{{ n.pump }}</td>
                    <td><span class="badge" :class="n.fuel === 'MS' ? 'badge-ms' : n.fuel === 'HSD' ? 'badge-hsd' : 'badge-speed'">{{ n.fuel }}</span></td>
                    <td><span class="badge" :class="n.active ? 'badge-green' : 'badge-red'">{{ n.active ? 'Active' : 'Inactive' }}</span></td>
                    <td class="font-mono-custom text-[12px]">{{ n.lastReading }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- Users -->
        <template v-if="activeSection === 'users'">
          <div class="card">
            <div class="card-header">
              <span class="text-lg">👤</span>
              <div><div class="font-display font-bold text-[15px] text-white">User Management</div><div class="text-[11.5px] text-[#5a6a82] mt-0.5">Control login access and roles</div></div>
              <button class="btn btn-primary ml-auto text-[12px] py-1">＋ Add User</button>
            </div>
            <div class="overflow-x-auto">
              <table class="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Last Login</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  <tr v-for="u in users" :key="u.email">
                    <td>
                      <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-display text-white"
                          :style="{ background: u.color }">{{ u.name.slice(0,2).toUpperCase() }}</div>
                        <span class="font-medium text-white">{{ u.name }}</span>
                      </div>
                    </td>
                    <td class="font-mono-custom text-[12px] text-[#8a9ab5]">{{ u.email }}</td>
                    <td>
                      <span class="badge"
                        :class="u.role === 'Admin' ? 'badge-ms' : u.role === 'Manager' ? 'badge-blue' : 'badge-gray'">
                        {{ u.role }}
                      </span>
                    </td>
                    <td class="text-[12px] text-[#5a6a82]">{{ u.lastLogin }}</td>
                    <td><span class="badge" :class="u.active ? 'badge-green' : 'badge-red'">{{ u.active ? 'Active' : 'Inactive' }}</span></td>
                    <td>
                      <div class="flex gap-1.5">
                        <button class="btn btn-ghost py-0.5 px-2 text-[11px]">✏️ Edit</button>
                        <button class="btn btn-danger py-0.5 px-2 text-[11px]" v-if="u.role !== 'Admin'">🗑</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- Notifications -->
        <template v-if="activeSection === 'notifications'">
          <div class="card">
            <div class="card-header">
              <span class="text-lg">🔔</span>
              <div><div class="font-display font-bold text-[15px] text-white">Notification Preferences</div></div>
            </div>
            <div class="card-body space-y-4">
              <div v-for="notif in notifications" :key="notif.key"
                class="flex items-center justify-between p-4 rounded-xl"
                style="background:#161b24; border:1px solid #1c2230">
                <div class="flex items-center gap-3">
                  <span class="text-lg">{{ notif.icon }}</span>
                  <div>
                    <div class="font-medium text-white text-[13.5px]">{{ notif.label }}</div>
                    <div class="text-[11.5px] text-[#5a6a82]">{{ notif.sub }}</div>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" v-model="notif.enabled" class="sr-only peer">
                  <div class="w-10 h-5 rounded-full peer-checked:bg-[#f59e0b] bg-[#242d3e] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-5"></div>
                </label>
              </div>
            </div>
          </div>
        </template>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useUiStore } from '@/stores/ui'
import PageHeader from '@/components/ui/PageHeader.vue'

const ui = useUiStore()
const activeSection = ref('station')

const sections = [
  { key:'station',       icon:'🏪', label:'Station Details' },
  { key:'fuel',          icon:'⛽', label:'Fuel Rates' },
  { key:'nozzles',       icon:'🔧', label:'Nozzle Config' },
  { key:'users',         icon:'👤', label:'User Access' },
  { key:'notifications', icon:'🔔', label:'Notifications' },
]

const settings = reactive({
  stationName: 'Kailas Petromines',
  dealerCode:  'HP-MH-2024-0891',
  ownerName:   'Kailas Patil',
  phone:       '+91 98765 43210',
  address:     'NH 48, Near MIDC Gate, Khopoli',
  city:        'Khopoli',
  state:       'Maharashtra',
  gst:         '27AAAAA0000A1Z5',
  pan:         'AAAAA0000A',
})

const fuelRates = reactive([
  { key:'ms',    name:'MS Petrol',   abbr:'MS',  type:'Motor Spirit',    rate:104.77, effectiveDate:'2026-04-01', color:'#f59e0b' },
  { key:'hsd',   name:'HSD Diesel',  abbr:'HSD', type:'High Speed Diesel',rate:91.28, effectiveDate:'2026-04-01', color:'#10b981' },
  { key:'speed', name:'Speed',       abbr:'SP',  type:'Premium Petrol',  rate:113.85, effectiveDate:'2026-04-01', color:'#3b82f6' },
])

const nozzles = [
  { id:'MS-01', pump:'Pump 1', fuel:'MS',    active:true,  lastReading:'265,422.57' },
  { id:'MS-02', pump:'Pump 1', fuel:'MS',    active:true,  lastReading:'265,422.57' },
  { id:'MS-03', pump:'Pump 2', fuel:'MS',    active:true,  lastReading:'354,926.72' },
  { id:'MS-04', pump:'Pump 2', fuel:'MS',    active:true,  lastReading:'354,926.72' },
  { id:'MS-05', pump:'Pump 3', fuel:'MS',    active:true,  lastReading:'101,181.38' },
  { id:'MS-06', pump:'Pump 3', fuel:'MS',    active:false, lastReading:'101,181.38' },
  { id:'HSD-01',pump:'Pump 4', fuel:'HSD',   active:true,  lastReading:'48,235.60'  },
  { id:'HSD-02',pump:'Pump 4', fuel:'HSD',   active:true,  lastReading:'48,235.60'  },
  { id:'SP-01', pump:'Pump 5', fuel:'Speed', active:true,  lastReading:'12,450.22'  },
  { id:'SP-02', pump:'Pump 5', fuel:'Speed', active:true,  lastReading:'12,450.22'  },
]

const users = [
  { name:'Kailas Patil', email:'admin@petromines.com',   role:'Admin',   lastLogin:'Today, 9:12 AM', active:true,  color:'#f59e0b' },
  { name:'Shaikh Ahmed', email:'manager@petromines.com',  role:'Manager', lastLogin:'Today, 8:45 AM', active:true,  color:'#6366f1' },
  { name:'Ajay Kumar',   email:'ajay@petromines.com',     role:'Staff',   lastLogin:'Yesterday',      active:true,  color:'#10b981' },
  { name:'Santosh R',   email:'santosh@petromines.com',   role:'Staff',   lastLogin:'2 days ago',     active:false, color:'#ef4444' },
]

const notifications = reactive([
  { key:'daily',   icon:'📊', label:'Daily Sales Summary',    sub:'Get end-of-day summary via WhatsApp', enabled:true  },
  { key:'stock',   icon:'🛢️', label:'Low Stock Alert',         sub:'Alert when fuel drops below threshold', enabled:true  },
  { key:'salary',  icon:'💰', label:'Monthly Salary Reminder', sub:'Remind on 28th to process payroll', enabled:false },
  { key:'expense', icon:'🧾', label:'High Expense Alert',      sub:'Alert when daily expense exceeds ₹10,000', enabled:true  },
  { key:'meter',   icon:'📈', label:'Meter Variation Alert',   sub:'Alert on large meter discrepancies', enabled:false },
])

const saveAll = () => ui.success('Settings saved successfully!')
</script>

<style scoped>
.field-label {
  display: block;
  font-size: 11.5px;
  color: #8a9ab5;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}
</style>
