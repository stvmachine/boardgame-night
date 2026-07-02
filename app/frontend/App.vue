<script setup lang="ts">
// Shell component — minimal centered layout with RouterView
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col items-center justify-center p-8">
    <main class="w-full max-w-xl">
      <RouterView />
    </main>
  </div>
</template>
