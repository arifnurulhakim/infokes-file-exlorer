<script setup lang="ts">
defineProps<{ expanded?: boolean }>();
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="chevron"
    :class="{ expanded }"
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
</template>

<style scoped>
.chevron {
  transition: transform 0.12s ease;
}
.chevron.expanded {
  transform: rotate(90deg);
}
</style>
