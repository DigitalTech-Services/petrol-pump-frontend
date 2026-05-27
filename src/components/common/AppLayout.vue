<template>
  <div class="flex h-screen overflow-hidden" style="background:#0a0c10">

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
      <main class="flex-1 overflow-y-auto" style="background:#0a0c10">
        <div class="px-6 py-6 max-w-[1440px] mx-auto">
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
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'
import AppSidebar from './AppSidebar.vue'
import AppTopbar  from './AppTopbar.vue'

const ui = useUiStore()
const { width } = useWindowSize()
const isDesktop  = computed(() => width.value >= 1024)
</script>
