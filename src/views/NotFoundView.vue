<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background:#0a0c10">
    <div class="text-center">
      <div class="text-[100px] leading-none mb-6 opacity-20">⛽</div>
      <h1 class="font-display font-bold text-[80px] text-[#f59e0b] leading-none mb-2">404</h1>
      <h2 class="font-display font-bold text-[24px] text-white mb-3">Page Not Found</h2>
      <p class="text-[14px] text-[#5a6a82] mb-8 max-w-sm mx-auto">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <RouterLink to="/dashboard" class="btn btn-primary px-8 py-2.5 text-[14px]">
        ← Back to Dashboard
      </RouterLink>
    </div>
  </div>
</template>
