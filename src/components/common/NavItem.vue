// components/common/NavItem.vue

<template>
  <RouterLink
    :to="to"
    class="nav-item"
    :class="{ active: isActive }"
    @click="ui.closeSidebar()"
  >
    <!-- ICON -->
    <component
      :is="icon"
      :size="18"
      stroke-width="2"
      class="nav-icon"
    />

    <!-- LABEL -->
    <span class="truncate flex-1">
      {{ label }}
    </span>

    <!-- OPTIONAL BADGE -->
    <slot name="badge" />
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  to: {
    type: String,
    required: true
  },

  icon: {
    type: Object,
    required: true
  },

  label: {
    type: String,
    required: true
  }
})

const route = useRoute()
const ui = useUiStore()

const isActive = computed(() => {
  if (props.to === '/dashboard') {
    return route.path === '/dashboard'
  }

  return route.path.startsWith(props.to)
})
</script>

<style scoped>
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;

  width: 100%;

  padding: 11px 12px;
  margin-bottom: 4px;

  border-radius: 12px;

  color: #94a3b8;

  font-size: 14px;
  font-weight: 500;

  transition: all 0.2s ease;
}

.nav-item:hover {
  background: #161b24;
  color: #ffffff;
}

.nav-item.active {
  background: linear-gradient(
    135deg,
    rgba(245, 158, 11, 0.18),
    rgba(245, 158, 11, 0.08)
  );

  color: #f59e0b;

  border: 1px solid rgba(245, 158, 11, 0.2);
}

.nav-icon {
  flex-shrink: 0;
}
</style>