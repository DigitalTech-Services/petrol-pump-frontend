<template>
  <RouterLink
    :to="to"
    class="nav-item"
    :class="{ active: isActive }"
    @click="ui.closeSidebar()"
  >
    <component
  :is="icon"
  :size="18"
  class="flex-shrink-0"
/>
    <span class="truncate flex-1">{{ label }}</span>
    <slot name="badge" />
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const props  = defineProps({ to: String, icon: Object, label: String })
const route  = useRoute()
const ui     = useUiStore()

const isActive = computed(() => {
  if (props.to === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(props.to)
})
</script>
