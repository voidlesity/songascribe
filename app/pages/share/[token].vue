<template>
  <div class="max-w-5xl mx-auto p-4 md:p-6">
    <div v-if="loading" class="flex justify-center py-20">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="error" class="text-center py-20">
      <Icon
        name="mdi:link-variant-off"
        size="3rem"
        class="opacity-30 mx-auto mb-2"
      />
      <h2 class="text-xl font-semibold mb-1">{{ error }}</h2>
      <p class="opacity-60 mb-4">The share link may be invalid or expired.</p>
      <NuxtLink to="/" class="btn btn-primary btn-sm">Home</NuxtLink>
    </div>

    <div v-else-if="category" class="space-y-4">
      <header
        class="card card-border bg-base-100 flex-row items-center justify-between p-4"
      >
        <div>
          <div class="flex items-center gap-2 text-xs opacity-60 mb-1">
            <Icon name="mdi:share-variant" /> Shared category
          </div>
          <h1 class="text-2xl font-semibold">{{ category.name }}</h1>
        </div>
        <NuxtLink to="/" class="btn btn-ghost btn-sm">
          <Icon name="mdi:home" /> Home
        </NuxtLink>
      </header>

      <div
        v-if="category.items.length"
        class="grid grid-cols-1 lg:grid-cols-2 gap-3"
      >
        <article
          v-for="item in category.items"
          :key="item.id"
          class="card card-border bg-base-100"
        >
          <div class="card-body p-4">
            <h2 class="font-semibold mb-2">{{ item.name }}</h2>
            <SongList :songs="item.tracks" :item-name="item.name" />
          </div>
        </article>
      </div>

      <div v-else class="text-center py-16 opacity-60">
        No items in this category yet
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Track } from "~/composables/useTrackSearch";

interface SharedCategory {
  id: number;
  name: string;
  items: { id: number; name: string; tracks: Track[] }[];
}

const route = useRoute();
const token = route.params.token as string;

const category = ref<SharedCategory | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    category.value = await $fetch<SharedCategory>(`/api/shares/${token}`);
  } catch (err) {
    const e = err as { statusCode?: number };
    error.value =
      e.statusCode === 404
        ? "Share not found"
        : "Failed to load shared category";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
