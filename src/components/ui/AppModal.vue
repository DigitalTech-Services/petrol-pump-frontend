<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-[200] flex items-center justify-center p-4">

        <!-- Backdrop -->
        <div
          class="absolute inset-0"
          style="background:rgba(0,0,0,0.75); backdrop-filter:blur(4px)"
          @click="$emit('update:modelValue', false)"
        />

        <!-- Panel -->
        <div
          class="relative w-full rounded-2xl flex flex-col shadow-2xl"
          :style="{
            maxWidth: maxWidth,
            maxHeight: '92vh',
            background: 'var(--bg-2)',
            border: '1px solid var(--border-2)'
          }"
        >
          <!-- Header -->
          <div class="flex items-center gap-3 px-6 py-4 flex-shrink-0" style="border-bottom:1px solid var(--border)">
            <component v-if="icon" :is="icon" :size="20" class="flex-shrink-0 text-[#f59e0b]" />
            <div class="flex-1 min-w-0">
              <div class="font-display font-bold text-[17px] text-[var(--text)]">{{ title }}</div>
              <div v-if="subtitle" class="text-[12px] text-[var(--text-3)] mt-0.5">{{ subtitle }}</div>
            </div>
            <button
              @click="$emit('update:modelValue', false)"
              class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--bg-4)] transition-all flex-shrink-0 text-lg"
            ><X :size="16" /></button>
          </div>

          <!-- Body (scrollable) -->
          <div class="overflow-y-auto flex-1 px-6 py-5">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="flex-shrink-0 px-6 py-4" style="border-top:1px solid var(--border)">
            <slot name="footer" />
          </div>
        </div>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { X } from 'lucide-vue-next'
defineProps({
  modelValue: { type: Boolean, required: true },
  title:      { type: String,  required: true },
  subtitle:   { type: String,  default: '' },
  icon:       { type: [Object, Function], default: null },
  maxWidth:   { type: String,  default: '560px' },
})
defineEmits(['update:modelValue'])
</script>

<style>
.modal-enter-active { transition: all 0.22s ease; }
.modal-leave-active { transition: all 0.18s ease; }
.modal-enter-from   { opacity: 0; transform: scale(0.95) translateY(-10px); }
.modal-leave-to     { opacity: 0; transform: scale(0.95) translateY(-10px); }
</style>
