<template>
  <div class="mb-6">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h1 class="font-display font-bold text-[26px] text-white leading-none">{{ title }}</h1>
        <p v-if="subtitle" class="text-[13px] text-[#8a9ab5] mt-1">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.actions" class="flex items-center gap-2 flex-shrink-0">
        <slot name="actions" />
      </div>
    </div>
    <!-- Breadcrumb -->
    <div v-if="crumbs.length" class="flex items-center gap-1.5 mt-2 text-[11.5px] text-[#5a6a82]">
      <span v-for="(c, i) in crumbs" :key="i" class="flex items-center gap-1.5">
        <span>{{ c }}</span>
        <span v-if="i < crumbs.length - 1" class="opacity-40">/</span>
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title:    { type: String, required: true },
  subtitle: { type: String, default: '' },
  crumbs:   { type: Array, default: () => [] },
})
</script>
