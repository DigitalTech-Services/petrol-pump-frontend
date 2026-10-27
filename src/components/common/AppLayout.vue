<template>
   <div class="flex h-screen overflow-hidden" style="background:var(--bg)">

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div v-if="ui.sidebarOpen" class="sidebar-overlay lg:hidden" @click="ui.closeSidebar()" />
    </Transition>

    <!-- SIDEBAR -->
    <AppSidebar />

    <!-- MAIN CONTENT -->
    <div
      class="flex flex-col flex-1 min-w-0 overflow-hidden"
      :style="{ marginLeft: isDesktop ? 'var(--sidebar-w, 248px)' : '0' }"
    >
      <!-- Top Bar -->
      <AppTopbar />

      <!-- Page Content with scroll -->
      <main class="flex-1 overflow-y-auto" style="background:var(--bg)">
        <div class="px-6 py-6 max-w-[1440px] mx-auto">
          <!-- Unassigned manager — every save would be rejected, so say why up front -->
          <div v-if="auth.needsStation" class="flex items-start gap-2.5 px-4 py-3 mb-5 rounded-xl text-[13px] text-[#f59e0b]"
            style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.3)">
            <AlertTriangle :size="16" class="flex-shrink-0 mt-0.5" />
            <span>{{ STATION_NOT_ASSIGNED }} Until then you can view pages but cannot add or change entries.</span>
          </div>
          <RouterView v-slot="{ Component, route }">
            <Transition name="page" mode="out-in">
              <component :is="Component" :key="route.fullPath" />
            </Transition>
          </RouterView>
        </div>
      </main>
    </div>

  </div>
</template>

<script setup>
import { useWindowSize } from '@vueuse/core'
import { computed, onMounted } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { STATION_NOT_ASSIGNED } from '@/services/api'
import AppSidebar from './AppSidebar.vue'
import AppTopbar  from './AppTopbar.vue'

const ui   = useUiStore()
const auth = useAuthStore()
const { width } = useWindowSize()
const isDesktop  = computed(() => width.value >= 1024)

// Pick up a station assigned by the owner after this manager logged in
onMounted(() => { if (auth.isManager) auth.refreshProfile().catch(() => {}) })
</script>
