<template>
  <RouterLink
    :to="to"
    class="nav-item"
    :class="{ active: isActive }"
    @click="ui.closeSidebar()"
  >
    <span class="text-base w-5 text-center flex-shrink-0">{{ icon }}</span>
    <span class="truncate flex-1">{{ label }}</span>
    <slot name="badge" />
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const props  = defineProps({ to: String, icon: String, label: String })
const route  = useRoute()
const ui     = useUiStore()

const isActive = computed(() => {
  if (props.to === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(props.to)
})
</script>
