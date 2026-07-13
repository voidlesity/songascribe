<template>
  <div
    role="alert"
    class="flex items-center justify-center gap-2 px-3 pb-2 text-xs text-error"
  >
    <Icon name="mdi:alert-circle-outline" />
    <span class="truncate">{{ message }}</span>
    <button type="button" class="btn btn-ghost btn-xs" @click="$emit('retry')">
      Retry
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string;
}>();

defineEmits<{
  retry: [];
}>();
</script>
