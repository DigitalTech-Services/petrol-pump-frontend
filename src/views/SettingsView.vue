<template>
  <div>
    <PageHeader title="Settings" subtitle="Station configuration & system preferences" :crumbs="['Home','Settings']">
      <template #actions>
        <button
          v-if="auth.canWrite && ['station','fuel','notifications'].includes(activeSection)"
          class="btn btn-primary flex items-center gap-2"
          @click="saveAll"
          :disabled="saving"
        >
          <RotateCw v-if="saving" :size="14" class="animate-spin" /><Save v-else :size="14" />
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
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
            <component :is="s.icon" :size="16" class="flex-shrink-0" />
            <span class="font-medium">{{ s.label }}</span>
          </button>
        </div>
      </div>

      <!-- Content Panel -->
      <div class="lg:col-span-3 space-y-5">

        <!-- Owner with no station selected — station/fuel/nozzle config is single-station -->
        <template v-if="['station','fuel','nozzles'].includes(activeSection) && noStationSelected">
          <div class="card">
            <div class="card-body text-center py-12">
              <Building2 :size="32" class="mx-auto mb-3 text-[#2a3548]" />
              <div class="text-[13px] text-[#8a9ab5]">Select a station from the top bar to view its settings.</div>
              <div class="text-[11px] text-[#5a6a82] mt-1">"All Stations" has no single configuration to show.</div>
            </div>
          </div>
        </template>

        <!-- Station Details -->
        <template v-else-if="activeSection === 'station'">
          <div class="card">
            <div class="card-header">
              <Building2 :size="18" class="text-[#f59e0b]" />
              <div>
                <div class="font-display font-bold text-[15px] text-white">Station Details</div>
                <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Basic information about your fuel station</div>
              </div>
            </div>
            <div v-if="stationLoading" class="card-body text-center text-[13px] text-[#5a6a82] py-8">
              <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
            </div>
            <div v-else-if="stationError" class="card-body text-center py-8">
              <p class="text-[#ef4444] text-[13px] mb-2">{{ stationError }}</p>
              <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadStation">Retry</button>
            </div>
            <div v-else class="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label class="field-label">Station Name</label><input v-model="settings.stationName" :disabled="!auth.canWrite" class="form-input w-full" /></div>
              <div><label class="field-label">HP Dealer Code</label><input v-model="settings.dealerCode" :disabled="!auth.canWrite" class="form-input w-full" /></div>
              <div><label class="field-label">Owner Name</label><input v-model="settings.ownerName" :disabled="!auth.canWrite" class="form-input w-full" /></div>
              <div><label class="field-label">Contact Number</label><input v-model="settings.phone" :disabled="!auth.canWrite" class="form-input w-full" /></div>
              <div class="sm:col-span-2"><label class="field-label">Address</label><textarea v-model="settings.address" :disabled="!auth.canWrite" class="form-input w-full" rows="2" /></div>
              <div><label class="field-label">City</label><input v-model="settings.city" :disabled="!auth.canWrite" class="form-input w-full" /></div>
              <div><label class="field-label">State</label><input v-model="settings.state" :disabled="!auth.canWrite" class="form-input w-full" /></div>
              <div><label class="field-label">GST Number</label><input v-model="settings.gst" :disabled="!auth.canWrite" class="form-input w-full" /></div>
              <div><label class="field-label">PAN Number</label><input v-model="settings.pan" :disabled="!auth.canWrite" class="form-input w-full" /></div>
            </div>
          </div>
        </template>

        <!-- Fuel Rates -->
        <template v-else-if="activeSection === 'fuel'">
          <div class="card">
            <div class="card-header">
              <Fuel :size="18" class="text-[#f59e0b]" />
              <div>
                <div class="font-display font-bold text-[15px] text-white">Fuel Rates</div>
                <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Current fuel prices (auto-affects revenue calculations)</div>
              </div>
              <span class="ml-auto badge badge-green">Live Rates</span>
            </div>
            <div v-if="fuelLoading" class="card-body text-center text-[13px] text-[#5a6a82] py-8">
              <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
            </div>
            <div v-else-if="fuelError" class="card-body text-center py-8">
              <p class="text-[#ef4444] text-[13px] mb-2">{{ fuelError }}</p>
              <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadFuelRates">Retry</button>
            </div>
            <div v-else class="card-body space-y-5">
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
                    <input type="number" step="0.01" v-model="fuel.rate" :disabled="!auth.canWrite" class="form-input w-full" /></div>
                  <div><label class="field-label">Effective Date</label>
                    <input type="date" v-model="fuel.effectiveDate" :disabled="!auth.canWrite" class="form-input w-full" /></div>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- Nozzle Config -->
        <template v-else-if="activeSection === 'nozzles'">
          <div class="card">
            <div class="card-header">
              <Wrench :size="18" class="text-[#f59e0b]" />
              <div>
                <div class="font-display font-bold text-[15px] text-white">Nozzle Configuration</div>
                <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Pump and nozzle assignments</div>
              </div>
              <button v-if="auth.canWrite" class="btn btn-primary ml-auto text-[12px] py-1 flex items-center gap-1" @click="openAddNozzle"><Plus :size="12" /> Add Nozzle</button>
            </div>

            <div v-if="nozzlesLoading" class="card-body text-center text-[13px] text-[#5a6a82] py-8">
              <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
            </div>
            <div v-else-if="nozzlesError" class="card-body text-center py-8">
              <p class="text-[#ef4444] text-[13px] mb-2">{{ nozzlesError }}</p>
              <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadNozzles">Retry</button>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr><th>Nozzle ID</th><th>Pump</th><th>Fuel Type</th><th>Status</th><th>Last Reading</th><th>Action</th></tr>
                </thead>
                <tbody>
                  <tr v-for="n in nozzles" :key="n.nozzleId">
                    <td class="font-mono-custom text-[#f59e0b]">{{ n.nozzleId }}</td>
                    <td>{{ n.pump }}</td>
                    <td><span class="badge" :class="n.fuel === 'MS' ? 'badge-ms' : n.fuel === 'HSD' ? 'badge-hsd' : 'badge-speed'">{{ n.fuel }}</span></td>
                    <td><span class="badge" :class="n.active ? 'badge-green' : 'badge-red'">{{ n.active ? 'Active' : 'Inactive' }}</span></td>
                    <td class="font-mono-custom text-[12px]">{{ n.lastReading || '—' }}</td>
                    <td>
                      <div v-if="auth.canWrite" class="flex gap-1.5">
                        <button class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" @click="openEditNozzle(n)"><Pencil :size="11" /> Edit</button>
                        <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDeleteNozzle(n)"><Trash2 :size="11" /></button>
                      </div>
                      <span v-else class="text-[11px] text-[#5a6a82]">—</span>
                    </td>
                  </tr>
                  <tr v-if="!nozzles.length">
                    <td colspan="6" class="text-center text-[12.5px] text-[#5a6a82] py-6">
                      No nozzles configured. Click <strong class="text-white">+ Add Nozzle</strong> to create one.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Add / Edit Nozzle Modal -->
          <Transition name="modal-fade">
            <div v-if="nozzleModal.open"
              class="fixed inset-0 z-50 flex items-center justify-center px-4"
              style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px)"
              @mousedown.self="nozzleModal.open = false">
              <div class="w-full max-w-[440px] rounded-2xl p-6" style="background:#0f1218; border:1px solid #242d3e">
                <h3 class="font-display font-bold text-[17px] text-white mb-1">
                  {{ nozzleModal.mode === 'add' ? 'Add Nozzle' : 'Edit Nozzle' }}
                </h3>
                <p class="text-[12px] text-[#5a6a82] mb-5">
                  {{ nozzleModal.mode === 'add' ? 'Register a new nozzle on a pump.' : 'Update nozzle details.' }}
                </p>
                <form @submit.prevent="submitNozzle">
                  <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label class="field-label">Nozzle ID</label>
                      <input v-model="nozzleForm.nozzleId" type="text" class="form-input w-full"
                        placeholder="MS-01" required :disabled="nozzleModal.mode === 'edit'" />
                    </div>
                    <div>
                      <label class="field-label">Pump</label>
                      <input v-model="nozzleForm.pump" type="text" class="form-input w-full"
                        placeholder="Pump 1" required />
                    </div>
                  </div>
                  <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label class="field-label">Fuel Type</label>
                      <select v-model="nozzleForm.fuel" class="form-input w-full" required>
                        <option value="MS">MS Petrol</option>
                        <option value="HSD">HSD Diesel</option>
                        <option value="Speed">Speed</option>
                      </select>
                    </div>
                    <div>
                      <label class="field-label">Last Reading</label>
                      <input v-model="nozzleForm.lastReading" type="text" class="form-input w-full"
                        placeholder="0.00" />
                    </div>
                  </div>
                  <div class="mb-5 flex items-center justify-between p-3 rounded-xl"
                    style="background:#161b24; border:1px solid #1c2230">
                    <span class="text-[13px] text-white">Active Status</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" v-model="nozzleForm.active" class="sr-only peer">
                      <div class="w-10 h-5 rounded-full peer-checked:bg-[#f59e0b] bg-[#242d3e] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:w-4 after:h-4 after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                  </div>
                  <Transition name="fade">
                    <div v-if="nozzleSubmitError" class="mb-4 px-3 py-2.5 rounded-lg text-[12px]"
                      style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444">
                      <AlertTriangle :size="13" class="inline mr-1" />{{ nozzleSubmitError }}
                    </div>
                  </Transition>
                  <div class="flex gap-3 justify-end">
                    <button type="button" @click="nozzleModal.open = false"
                      class="px-4 py-2 rounded-xl text-[12.5px] font-medium text-[#8a9ab5] hover:text-white"
                      style="background:#161b24; border:1px solid #242d3e">Cancel</button>
                    <button type="submit"
                      class="btn btn-primary px-5 py-2 flex items-center gap-2"
                      :disabled="nozzleSubmitting">
                      <RotateCw v-if="nozzleSubmitting" :size="14" class="animate-spin" />
                      {{ nozzleSubmitting ? 'Saving…' : (nozzleModal.mode === 'add' ? 'Add Nozzle' : 'Save Changes') }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </Transition>

          <!-- Delete Nozzle Confirmation -->
          <Transition name="modal-fade">
            <div v-if="nozzleDeleteModal.open"
              class="fixed inset-0 z-50 flex items-center justify-center px-4"
              style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px)"
              @mousedown.self="nozzleDeleteModal.open = false">
              <div class="w-full max-w-[360px] rounded-2xl p-6" style="background:#0f1218; border:1px solid #242d3e">
                <h3 class="font-display font-bold text-[17px] text-white mb-1">Remove Nozzle</h3>
                <p class="text-[13px] text-[#5a6a82] mb-5">
                  Remove nozzle <strong class="text-white">{{ nozzleDeleteModal.nozzle?.nozzleId }}</strong>?
                  This action cannot be undone.
                </p>
                <Transition name="fade">
                  <div v-if="nozzleDeleteError" class="mb-4 px-3 py-2.5 rounded-lg text-[12px]"
                    style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444">
                    <AlertTriangle :size="13" class="inline mr-1" />{{ nozzleDeleteError }}
                  </div>
                </Transition>
                <div class="flex gap-3 justify-end">
                  <button @click="nozzleDeleteModal.open = false"
                    class="px-4 py-2 rounded-xl text-[12.5px] font-medium text-[#8a9ab5] hover:text-white"
                    style="background:#161b24; border:1px solid #242d3e">Cancel</button>
                  <button @click="confirmDeleteNozzle"
                    class="btn btn-danger px-5 py-2 flex items-center gap-2"
                    :disabled="nozzleDeleting">
                    <RotateCw v-if="nozzleDeleting" :size="14" class="animate-spin" />
                    {{ nozzleDeleting ? 'Removing…' : 'Remove' }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </template>

        <!-- Users (owner only) -->
        <template v-else-if="activeSection === 'users'">
          <div class="card">
            <div class="card-header">
              <User :size="18" class="text-[#f59e0b]" />
              <div>
                <div class="font-display font-bold text-[15px] text-white">User Management</div>
                <div class="text-[11.5px] text-[#5a6a82] mt-0.5">Manage manager accounts for this station</div>
              </div>
              <button class="btn btn-primary ml-auto text-[12px] py-1 flex items-center gap-1" @click="openAddManager"><Plus :size="12" /> Add Manager</button>
            </div>

            <div v-if="managersLoading" class="card-body text-center text-[13px] text-[#5a6a82] py-8">
              <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
            </div>
            <div v-else-if="managersError" class="card-body text-center py-8">
              <p class="text-[#ef4444] text-[13px] mb-2">{{ managersError }}</p>
              <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadManagers">Retry</button>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Contact</th><th>Role</th><th>Created</th><th>Action</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-display text-white"
                          style="background:linear-gradient(135deg,#f59e0b,#d97706)">
                          {{ initials(auth.fullName) }}
                        </div>
                        <span class="font-medium text-white">{{ auth.fullName }}</span>
                      </div>
                    </td>
                    <td class="font-mono-custom text-[12px] text-[#8a9ab5]">{{ auth.user?.email }}</td>
                    <td class="text-[12px] text-[#8a9ab5]">{{ auth.user?.contact || '—' }}</td>
                    <td><span class="badge badge-ms">Owner</span></td>
                    <td class="text-[12px] text-[#5a6a82]">—</td>
                    <td><span class="text-[11px] text-[#5a6a82]">Current account</span></td>
                  </tr>
                  <tr v-for="m in managers" :key="m.id">
                    <td>
                      <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold font-display text-white"
                          :style="{ background: avatarColor(m.name) }">
                          {{ initials(m.name) }}
                        </div>
                        <span class="font-medium text-white">{{ m.name }}</span>
                      </div>
                    </td>
                    <td class="font-mono-custom text-[12px] text-[#8a9ab5]">{{ m.email }}</td>
                    <td class="text-[12px] text-[#8a9ab5]">{{ m.contact || '—' }}</td>
                    <td><span class="badge badge-blue">Manager</span></td>
                    <td class="text-[12px] text-[#5a6a82]">{{ formatDate(m.created_at) }}</td>
                    <td>
                      <div class="flex gap-1.5">
                        <button class="btn btn-ghost py-0.5 px-2 text-[11px] flex items-center gap-1" @click="openEditManager(m)"><Pencil :size="11" /> Edit</button>
                        <button class="btn btn-danger py-0.5 px-2 text-[11px]" @click="openDeleteManager(m)"><Trash2 :size="11" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!managers.length">
                    <td colspan="6" class="text-center text-[12.5px] text-[#5a6a82] py-6">
                      No managers added yet. Click <strong class="text-white">+ Add Manager</strong> to create one.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Add / Edit Manager Modal -->
          <Transition name="modal-fade">
            <div v-if="managerModal.open"
              class="fixed inset-0 z-50 flex items-center justify-center px-4"
              style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px)"
              @mousedown.self="managerModal.open = false">
              <div class="w-full max-w-[420px] rounded-2xl p-6" style="background:#0f1218; border:1px solid #242d3e">
                <h3 class="font-display font-bold text-[17px] text-white mb-1">
                  {{ managerModal.mode === 'add' ? 'Add Manager' : 'Edit Manager' }}
                </h3>
                <p class="text-[12px] text-[#5a6a82] mb-5">
                  {{ managerModal.mode === 'add' ? 'Create a new manager account.' : 'Update manager details.' }}
                </p>
                <form @submit.prevent="submitManager">
                  <div class="mb-4">
                    <label class="field-label">Full Name</label>
                    <input v-model="managerForm.name" type="text" class="form-input w-full" placeholder="Shaikh Ahmed" required />
                  </div>
                  <div class="mb-4">
                    <label class="field-label">Email</label>
                    <input v-model="managerForm.email" type="email" class="form-input w-full" placeholder="manager@example.com" required />
                  </div>
                  <template v-if="managerModal.mode === 'add'">
                    <div class="mb-4">
                      <label class="field-label">Contact</label>
                      <input v-model="managerForm.contact" type="text" class="form-input w-full" placeholder="9876543210" maxlength="10" required />
                    </div>
                    <div class="mb-5">
                      <label class="field-label">Password</label>
                      <div class="relative">
                        <input v-model="managerForm.password" :type="showManagerPass ? 'text' : 'password'"
                          class="form-input w-full pr-10" placeholder="••••••••" required />
                        <button type="button" @click="showManagerPass = !showManagerPass"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a6a82] hover:text-white text-sm">
                          <component :is="showManagerPass ? EyeOff : Eye" :size="16" />
                        </button>
                      </div>
                    </div>
                  </template>
                  <Transition name="fade">
                    <div v-if="managerSubmitError" class="mb-4 px-3 py-2.5 rounded-lg text-[12px]"
                      style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444">
                      <AlertTriangle :size="13" class="inline mr-1" />{{ managerSubmitError }}
                    </div>
                  </Transition>
                  <div class="flex gap-3 justify-end">
                    <button type="button" @click="managerModal.open = false"
                      class="px-4 py-2 rounded-xl text-[12.5px] font-medium text-[#8a9ab5] hover:text-white"
                      style="background:#161b24; border:1px solid #242d3e">Cancel</button>
                    <button type="submit"
                      class="btn btn-primary px-5 py-2 flex items-center gap-2"
                      :disabled="managerSubmitting">
                      <RotateCw v-if="managerSubmitting" :size="14" class="animate-spin" />
                      {{ managerSubmitting ? 'Saving…' : (managerModal.mode === 'add' ? 'Add Manager' : 'Save Changes') }}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </Transition>

          <!-- Delete Confirmation Modal -->
          <Transition name="modal-fade">
            <div v-if="deleteModal.open"
              class="fixed inset-0 z-50 flex items-center justify-center px-4"
              style="background:rgba(0,0,0,0.7); backdrop-filter:blur(4px)"
              @mousedown.self="deleteModal.open = false">
              <div class="w-full max-w-[360px] rounded-2xl p-6" style="background:#0f1218; border:1px solid #242d3e">
                <h3 class="font-display font-bold text-[17px] text-white mb-1">Remove Manager</h3>
                <p class="text-[13px] text-[#5a6a82] mb-5">
                  Remove <strong class="text-white">{{ deleteModal.manager?.name }}</strong> as manager?
                  They will lose access immediately.
                </p>
                <Transition name="fade">
                  <div v-if="deleteError" class="mb-4 px-3 py-2.5 rounded-lg text-[12px]"
                    style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#ef4444">
                    <AlertTriangle :size="13" class="inline mr-1" />{{ deleteError }}
                  </div>
                </Transition>
                <div class="flex gap-3 justify-end">
                  <button @click="deleteModal.open = false"
                    class="px-4 py-2 rounded-xl text-[12.5px] font-medium text-[#8a9ab5] hover:text-white"
                    style="background:#161b24; border:1px solid #242d3e">Cancel</button>
                  <button @click="confirmDeleteManager"
                    class="btn btn-danger px-5 py-2 flex items-center gap-2"
                    :disabled="deleting">
                    <RotateCw v-if="deleting" :size="14" class="animate-spin" />
                    {{ deleting ? 'Removing…' : 'Remove' }}
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </template>

        <!-- Notifications (manager-personal, not offered to owner — see `sections` computed) -->
        <template v-else-if="activeSection === 'notifications'">
          <div class="card">
            <div class="card-header">
              <Bell :size="18" class="text-[#f59e0b]" />
              <div><div class="font-display font-bold text-[15px] text-white">Notification Preferences</div></div>
            </div>
            <div v-if="notifLoading" class="card-body text-center text-[13px] text-[#5a6a82] py-8">
              <RotateCw :size="14" class="animate-spin inline-block mr-2" />Loading…
            </div>
            <div v-else-if="notifError" class="card-body text-center py-8">
              <p class="text-[#ef4444] text-[13px] mb-2">{{ notifError }}</p>
              <button class="text-[#f59e0b] text-[12px] hover:underline" @click="loadNotifications">Retry</button>
            </div>
            <div v-else class="card-body space-y-4">
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useSelectedStationStore } from '@/stores/selectedStation'
import { userApi, settingsApi } from '@/services/api'
import PageHeader from '@/components/ui/PageHeader.vue'
import {
  Building2, Fuel, Wrench, User, Bell,
  RotateCw, Save, AlertTriangle, Plus, Pencil, Trash2, Eye, EyeOff
} from 'lucide-vue-next'

const ui              = useUiStore()
const auth            = useAuthStore()
const selectedStation = useSelectedStationStore()
const activeSection = ref('station')
const saving = ref(false)

// Owner has no "all stations" view for single-station config (station/fuel/nozzles).
const noStationSelected = computed(() => auth.isOwner && !selectedStation.selectedStationId)

const sections = computed(() => [
  { key:'station',       icon: Building2, label:'Station Details' },
  { key:'fuel',          icon: Fuel,      label:'Fuel Rates' },
  { key:'nozzles',       icon: Wrench,    label:'Nozzle Config' },
  ...(auth.isOwner ? [{ key:'users', icon: User, label:'User Access' }] : []),
  // Notifications are manager-personal, not station data — no owner view.
  ...(auth.isOwner ? [] : [{ key:'notifications', icon: Bell, label:'Notifications' }]),
])

// ── Station Details ──────────────────────────────────────────────
const stationLoading = ref(false)
const stationError   = ref('')
const settings = reactive({
  stationName: '', dealerCode: '', ownerName: '',
  phone: '', address: '', city: '', state: '', gst: '', pan: '',
})

function stationParam() {
  return auth.isOwner && selectedStation.selectedStationId
    ? { station_id: selectedStation.selectedStationId }
    : {}
}

async function loadStation() {
  stationLoading.value = true
  stationError.value   = ''
  try {
    const res = await settingsApi.getStation(stationParam())
    const s   = res.data?.station || {}
    settings.stationName = s.station_name || ''
    settings.dealerCode  = s.dealer_code  || ''
    settings.ownerName   = s.owner_name   || ''
    settings.phone       = s.phone        || ''
    settings.address     = s.address      || ''
    settings.city        = s.city         || ''
    settings.state       = s.state        || ''
    settings.gst         = s.gst          || ''
    settings.pan         = s.pan          || ''
  } catch (e) {
    stationError.value = e?.message || 'Failed to load station settings.'
  } finally {
    stationLoading.value = false
  }
}

async function saveStation() {
  saving.value = true
  try {
    await settingsApi.updateStation({
      station_name: settings.stationName,
      dealer_code:  settings.dealerCode,
      owner_name:   settings.ownerName,
      phone:        settings.phone,
      address:      settings.address,
      city:         settings.city,
      state:        settings.state,
      gst:          settings.gst,
      pan:          settings.pan,
    })
    ui.success('Station settings saved.')
  } catch (e) {
    ui.error(e?.message || 'Failed to save station settings.')
  } finally {
    saving.value = false
  }
}

// ── Fuel Rates ──────────────────────────────────────────────────
const fuelLoading = ref(false)
const fuelError   = ref('')
const fuelRates   = ref([])

async function loadFuelRates() {
  fuelLoading.value = true
  fuelError.value   = ''
  try {
    const res   = await settingsApi.getFuelRates(stationParam())
    const rates = res.data?.fuel_rates || []
    fuelRates.value = rates.map(r => ({
      key:           r.fuel_key,
      name:          r.name,
      abbr:          r.abbr,
      type:          r.type,
      rate:          r.rate,
      effectiveDate: r.effective_date,
      color:         r.color,
    }))
  } catch (e) {
    fuelError.value = e?.message || 'Failed to load fuel rates.'
  } finally {
    fuelLoading.value = false
  }
}

async function saveFuelRates() {
  saving.value = true
  try {
    await settingsApi.updateFuelRates({
      rates: fuelRates.value.map(f => ({
        fuel_key:       f.key,
        name:           f.name,
        abbr:           f.abbr,
        type:           f.type,
        rate:           f.rate,
        effective_date: f.effectiveDate,
        color:          f.color,
      })),
    })
    ui.success('Fuel rates saved.')
  } catch (e) {
    ui.error(e?.message || 'Failed to save fuel rates.')
  } finally {
    saving.value = false
  }
}

// ── Nozzles ─────────────────────────────────────────────────────
const nozzlesLoading = ref(false)
const nozzlesError   = ref('')
const nozzles        = ref([])

function mapNozzle(n) {
  return {
    id:          n.id          ?? null,
    nozzleId:    n.nozzle_id   ?? n.nozzleId  ?? '',
    pump:        n.pump        ?? '',
    fuel:        n.fuel        ?? 'MS',
    active:      n.active      ?? true,
    lastReading: n.last_reading ?? n.lastReading ?? '',
  }
}

async function loadNozzles() {
  nozzlesLoading.value = true
  nozzlesError.value   = ''
  try {
    const res  = await settingsApi.getNozzles(stationParam())
    const data = res.data?.nozzles || []
    nozzles.value = data.map(mapNozzle)
  } catch (e) {
    nozzlesError.value = e?.message || 'Failed to load nozzles.'
  } finally {
    nozzlesLoading.value = false
  }
}

const nozzleModal       = reactive({ open: false, mode: 'add', nozzleDbId: null })
const nozzleForm        = reactive({ nozzleId: '', pump: '', fuel: 'MS', active: true, lastReading: '' })
const nozzleSubmitting  = ref(false)
const nozzleSubmitError = ref('')

function openAddNozzle() {
  nozzleModal.mode      = 'add'
  nozzleModal.nozzleDbId = null
  nozzleForm.nozzleId   = ''
  nozzleForm.pump       = ''
  nozzleForm.fuel       = 'MS'
  nozzleForm.active     = true
  nozzleForm.lastReading= ''
  nozzleSubmitError.value = ''
  nozzleModal.open = true
}

function openEditNozzle(n) {
  nozzleModal.mode       = 'edit'
  nozzleModal.nozzleDbId = n.id
  nozzleForm.nozzleId    = n.nozzleId
  nozzleForm.pump        = n.pump
  nozzleForm.fuel        = n.fuel
  nozzleForm.active      = n.active
  nozzleForm.lastReading = n.lastReading
  nozzleSubmitError.value = ''
  nozzleModal.open = true
}

async function submitNozzle() {
  nozzleSubmitting.value  = true
  nozzleSubmitError.value = ''
  try {
    if (nozzleModal.mode === 'add') {
      await settingsApi.storeNozzle({
        nozzle_id:    nozzleForm.nozzleId,
        pump:         nozzleForm.pump,
        fuel:         nozzleForm.fuel,
        active:       nozzleForm.active,
        last_reading: nozzleForm.lastReading,
      })
      ui.success('Nozzle added.')
    } else {
      await settingsApi.updateNozzle(nozzleModal.nozzleDbId, {
        pump:         nozzleForm.pump,
        fuel:         nozzleForm.fuel,
        active:       nozzleForm.active,
        last_reading: nozzleForm.lastReading,
      })
      ui.success('Nozzle updated.')
    }
    nozzleModal.open = false
    await loadNozzles()
  } catch (e) {
    nozzleSubmitError.value = e?.message || 'Operation failed.'
  } finally {
    nozzleSubmitting.value = false
  }
}

const nozzleDeleteModal = reactive({ open: false, nozzle: null })
const nozzleDeleting    = ref(false)
const nozzleDeleteError = ref('')

function openDeleteNozzle(n) {
  nozzleDeleteModal.nozzle = n
  nozzleDeleteError.value  = ''
  nozzleDeleteModal.open   = true
}

async function confirmDeleteNozzle() {
  nozzleDeleting.value    = true
  nozzleDeleteError.value = ''
  try {
    await settingsApi.deleteNozzle(nozzleDeleteModal.nozzle.id)
    nozzleDeleteModal.open = false
    ui.success('Nozzle removed.')
    await loadNozzles()
  } catch (e) {
    nozzleDeleteError.value = e?.message || 'Delete failed.'
  } finally {
    nozzleDeleting.value = false
  }
}

// ── Notifications ────────────────────────────────────────────────
const notifLoading  = ref(false)
const notifError    = ref('')
const notifications = ref([])

async function loadNotifications() {
  notifLoading.value = true
  notifError.value   = ''
  try {
    const res  = await settingsApi.getNotifications()
    const data = res.data?.notifications || []
    notifications.value = data.map(n => ({
      key:     n.notif_key ?? n.key,
      icon:    n.icon,
      label:   n.label,
      sub:     n.sub,
      enabled: n.enabled,
    }))
  } catch (e) {
    notifError.value = e?.message || 'Failed to load notification preferences.'
  } finally {
    notifLoading.value = false
  }
}

async function saveNotifications() {
  saving.value = true
  try {
    await settingsApi.updateNotifications({
      notifications: notifications.value.map(n => ({
        notif_key: n.key,
        enabled:   n.enabled,
      })),
    })
    ui.success('Notification preferences saved.')
  } catch (e) {
    ui.error(e?.message || 'Failed to save notification preferences.')
  } finally {
    saving.value = false
  }
}

// ── Manager (sub-user) management ────────────────────────────────
const managers        = ref([])
const managersLoading = ref(false)
const managersError   = ref('')

const managerModal      = reactive({ open: false, mode: 'add', userId: null })
const managerForm       = reactive({ name: '', email: '', contact: '', password: '' })
const showManagerPass   = ref(false)
const managerSubmitting = ref(false)
const managerSubmitError= ref('')

const deleteModal = reactive({ open: false, manager: null })
const deleting    = ref(false)
const deleteError = ref('')

const AVATAR_COLORS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6']
function avatarColor(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}
function initials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('')
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function loadManagers() {
  managersLoading.value = true
  managersError.value   = ''
  try {
    const res = await userApi.getSubUsers()
    managers.value = res.data?.sub_users || []
  } catch (e) {
    managersError.value = e?.message || 'Failed to load managers.'
  } finally {
    managersLoading.value = false
  }
}

function openAddManager() {
  managerModal.mode    = 'add'
  managerModal.userId  = null
  managerForm.name     = ''
  managerForm.email    = ''
  managerForm.contact  = ''
  managerForm.password = ''
  managerSubmitError.value = ''
  showManagerPass.value    = false
  managerModal.open = true
}

function openEditManager(m) {
  managerModal.mode    = 'edit'
  managerModal.userId  = m.id
  managerForm.name     = m.name
  managerForm.email    = m.email
  managerForm.contact  = m.contact || ''
  managerForm.password = ''
  managerSubmitError.value = ''
  managerModal.open = true
}

function openDeleteManager(m) {
  deleteModal.manager = m
  deleteError.value   = ''
  deleteModal.open    = true
}

async function submitManager() {
  managerSubmitting.value  = true
  managerSubmitError.value = ''
  try {
    if (managerModal.mode === 'add') {
      await userApi.addSubUser({
        name: managerForm.name, email: managerForm.email,
        contact: managerForm.contact, password: managerForm.password,
      })
      ui.success('Manager added successfully.')
    } else {
      await userApi.updateSubUser({ user_id: managerModal.userId, name: managerForm.name, email: managerForm.email })
      ui.success('Manager updated.')
    }
    managerModal.open = false
    await loadManagers()
  } catch (e) {
    managerSubmitError.value = e?.message || 'Operation failed.'
  } finally {
    managerSubmitting.value = false
  }
}

async function confirmDeleteManager() {
  deleting.value    = true
  deleteError.value = ''
  try {
    await userApi.deleteSubUser({ user_id: deleteModal.manager.id })
    deleteModal.open = false
    ui.success('Manager removed.')
    await loadManagers()
  } catch (e) {
    deleteError.value = e?.message || 'Delete failed.'
  } finally {
    deleting.value = false
  }
}

// ── Section-aware save ───────────────────────────────────────────
async function saveAll() {
  switch (activeSection.value) {
    case 'station':       return saveStation()
    case 'fuel':          return saveFuelRates()
    case 'notifications': return saveNotifications()
  }
}

// ── Lazy load per section (load only on first visit) ─────────────
const loaded = reactive({ station: false, fuel: false, nozzles: false, notifications: false })

async function loadSection(section) {
  if (section === 'station' && !loaded.station) {
    loaded.station = true
    await loadStation()
  } else if (section === 'fuel' && !loaded.fuel) {
    loaded.fuel = true
    await loadFuelRates()
  } else if (section === 'nozzles' && !loaded.nozzles) {
    loaded.nozzles = true
    await loadNozzles()
  } else if (section === 'notifications' && !loaded.notifications) {
    loaded.notifications = true
    await loadNotifications()
  } else if (section === 'users') {
    loadManagers()
  }
}

watch(activeSection, loadSection)
onMounted(() => loadSection(activeSection.value))

// Owner switching the global station selector invalidates the single-station
// config sections — force a re-fetch of whichever one is currently open.
watch(() => selectedStation.selectedStationId, () => {
  if (!auth.isOwner) return
  loaded.station = loaded.fuel = loaded.nozzles = false
  loadSection(activeSection.value)
})
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
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
