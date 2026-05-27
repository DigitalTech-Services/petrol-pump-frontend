<template>
  <div class="card">

    <!-- Header -->
    <div v-if="title || $slots.actions" class="card-header">
      <div class="flex-1 min-w-0">
        <div class="font-display font-bold text-[15px] text-white">{{ title }}</div>
        <div v-if="subtitle" class="text-[11.5px] text-[#5a6a82] mt-0.5">{{ subtitle }}</div>
      </div>
      <div class="flex items-center gap-2 ml-auto flex-shrink-0">
        <slot name="actions" />
      </div>
    </div>

    <!-- Filters slot -->
    <div v-if="$slots.filters" class="px-5 py-3" style="border-bottom:1px solid #1c2230">
      <slot name="filters" />
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="data-table">
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key"
              :style="{ width: col.width, textAlign: col.align || 'left' }"
              class="cursor-pointer select-none"
              @click="col.sortable !== false && $emit('sort', col.key)"
            >
              {{ col.label }}
              <span v-if="sortKey === col.key" class="ml-1">{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading skeleton -->
          <template v-if="loading">
            <tr v-for="i in 8" :key="i">
              <td v-for="col in columns" :key="col.key">
                <div class="skeleton h-4 rounded" :style="{ width: Math.random() > 0.5 ? '70%' : '50%' }" />
              </td>
            </tr>
          </template>
          <!-- Empty state -->
          <template v-else-if="!rows.length">
            <tr>
              <td :colspan="columns.length" class="text-center py-16 text-[#5a6a82]">
                <div class="text-4xl mb-3">📭</div>
                <div class="font-medium">No records found</div>
                <div class="text-[12px] mt-1">Try adjusting your filters</div>
              </td>
            </tr>
          </template>
          <!-- Data rows -->
          <template v-else>
            <slot name="rows" :rows="rows" />
          </template>
        </tbody>
        <!-- Footer totals -->
        <tfoot v-if="$slots.footer && rows.length">
          <slot name="footer" />
        </tfoot>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="flex items-center justify-between px-5 py-3" style="border-top:1px solid #1c2230">
      <div class="text-[12px] text-[#5a6a82]">
        Showing {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, total) }} of {{ total }}
      </div>
      <div class="flex gap-1.5">
        <button class="btn btn-ghost py-1 px-2.5 text-[12px]" :disabled="currentPage === 1"
          @click="$emit('page', currentPage - 1)">‹ Prev</button>
        <button class="btn btn-ghost py-1 px-2.5 text-[12px]" :disabled="currentPage === totalPages"
          @click="$emit('page', currentPage + 1)">Next ›</button>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title:       { type: String, default: '' },
  subtitle:    { type: String, default: '' },
  columns:     { type: Array, required: true },
  rows:        { type: Array, default: () => [] },
  loading:     { type: Boolean, default: false },
  total:       { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  pageSize:    { type: Number, default: 30 },
  sortKey:     { type: String, default: '' },
  sortDir:     { type: String, default: 'asc' },
})
defineEmits(['sort', 'page'])

const totalPages = computed(() => Math.ceil((props.total || props.rows.length) / props.pageSize))
</script>
