<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background:var(--bg)">
    <div class="text-center">
      <Fuel :size="100" class="mx-auto mb-6 opacity-20 text-[#f59e0b]" />
      <h1 class="font-display font-bold text-[80px] text-[#f59e0b] leading-none mb-2">404</h1>
      <h2 class="font-display font-bold text-[24px] text-[var(--text)] mb-3">Page Not Found</h2>
      <p class="text-[14px] text-[var(--text-3)] mb-8 max-w-sm mx-auto">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <RouterLink to="/dashboard" class="btn btn-primary px-8 py-2.5 text-[14px]">
        ← Back to Dashboard
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { Fuel } from 'lucide-vue-next'
</script>
