<template>
<<<<<<< HEAD
  <h1>You did it!</h1>
  <p>
    Visit <a href="https://vuejs.org/" target="_blank" rel="noopener">vuejs.org</a> to read the
<<<<<<< HEAD
    documentation dakds
=======
    documentation
>>>>>>> fb57953 (Setup)
  </p>
=======
  <RouterView />
  <!-- Global Toast Notifications -->
  <Teleport to="body">
    <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="t in ui.toasts"
          :key="t.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl min-w-[280px] max-w-[380px] shadow-2xl border"
          :class="toastClass(t.type)"
        >
          <span class="text-lg flex-shrink-0">{{ toastIcon(t.type) }}</span>
          <span class="text-[13.5px] font-medium leading-snug">{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
>>>>>>> f13c80d (Claude.ai setup)
</template>

<script setup>
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const toastClass = (type) => ({
  success: 'bg-[#0f1218] border-[#10b981]/40 text-[#10b981]',
  error:   'bg-[#0f1218] border-[#ef4444]/40 text-[#ef4444]',
  info:    'bg-[#0f1218] border-[#3b82f6]/40 text-[#3b82f6]',
}[type] || 'bg-[#0f1218] border-[#242d3e] text-[#e8edf5]')

const toastIcon = (type) => ({ success: '✓', error: '✕', info: 'ℹ' }[type] || '·')
</script>
