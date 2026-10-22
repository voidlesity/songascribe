<template>
  <div
    v-if="categories.length"
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
  >
    <button
      v-for="category in categories"
      :key="category.id"
      class="card card-border bg-base-100 text-left hover:border-primary transition cursor-pointer"
      @click="emit('select', category)"
    >
      <div class="card-body p-4 gap-2">
        <div class="flex items-center gap-2">
          <div class="avatar">
            <div class="w-8 h-8 rounded-full bg-base-300">
              <img
                v-if="category.owner?.avatar"
                :src="category.owner.avatar"
                :alt="category.owner.username"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
              >
                <Icon name="mdi:account" />
              </div>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="font-semibold truncate">{{ category.name }}</h2>
            <p class="text-xs opacity-60 truncate">
              {{ category.owner?.username ?? "Unknown" }}
            </p>
          </div>
        </div>
        <p v-if="category.description" class="text-sm opacity-70 line-clamp-2">
          {{ category.description }}
        </p>
        <div class="flex gap-3 text-xs opacity-70">
          <span
            ><Icon name="mdi:library-music" /> {{ category.itemCount }}</span
          >
          <span><Icon name="mdi:music-note" /> {{ category.trackCount }}</span>
        </div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ categories: PublicCategorySummary[] }>();
const emit = defineEmits<{ select: [category: PublicCategorySummary] }>();
</script>
