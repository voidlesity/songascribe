<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
    <div
      v-for="card in cards"
      :key="card.label"
      class="card card-border bg-base-100"
    >
      <div class="card-body p-4 flex-row items-center gap-3">
        <Icon :name="card.icon" size="2rem" :class="card.color" />
        <div>
          <div class="text-2xl font-semibold">{{ card.value }}</div>
          <div class="text-xs opacity-60">{{ card.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ overview: Statistics["overview"] }>();
const cards = computed(() => [
  {
    label: "Categories",
    value: props.overview.totalCategories,
    icon: "mdi:folder-multiple",
    color: "text-primary",
  },
  {
    label: "Items",
    value: props.overview.totalItems,
    icon: "mdi:library-music",
    color: "text-secondary",
  },
  {
    label: "Tracks",
    value: props.overview.totalTracks,
    icon: "mdi:music-note",
    color: "text-accent",
  },
  {
    label: "Total",
    value: `${props.overview.totalDurationHours}h`,
    icon: "mdi:clock-outline",
    color: "text-info",
  },
]);
</script>
