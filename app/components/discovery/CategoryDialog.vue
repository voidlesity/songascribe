<template>
  <UiBaseDialog :open="!!summary" size="lg" @close="emit('close')">
    <div v-if="summary" class="flex items-center gap-3 mb-4">
      <div class="avatar">
        <div class="w-12 h-12 rounded-full bg-base-300">
          <img v-if="summary.owner?.avatar" :src="summary.owner.avatar" :alt="summary.owner.username" />
          <div v-else class="w-full h-full flex items-center justify-center"><Icon name="mdi:account" size="1.5rem" /></div>
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <h2 class="text-xl font-semibold truncate">{{ summary.name }}</h2>
        <p class="text-sm opacity-60">by {{ summary.owner?.username ?? "Unknown" }}</p>
      </div>
      <button
        v-if="loggedIn"
        class="btn btn-primary btn-sm"
        :disabled="importing"
        @click="emit('import')"
      >
        <span v-if="importing" class="loading loading-spinner loading-xs" />
        <Icon v-else name="mdi:download" /> Import
      </button>
    </div>

    <p v-if="summary?.description" class="text-sm opacity-80 whitespace-pre-line mb-4">{{ summary.description }}</p>
    <p v-if="message" class="alert alert-success text-sm mb-4">{{ message }}</p>
    <p v-if="mutationError" class="alert alert-error text-sm mb-4">{{ mutationError }}</p>

    <div v-if="loading" class="flex justify-center py-8"><span class="loading loading-spinner loading-lg" /></div>
    <div v-else-if="loadError" class="text-center py-8">
      <p class="text-error mb-3">{{ loadError }}</p>
      <button class="btn btn-sm" @click="emit('retry')">Retry</button>
    </div>
    <div v-else-if="detail" class="space-y-3 max-h-[60vh] overflow-y-auto">
      <article v-for="item in detail.items" :key="item.id" class="card card-border bg-base-200">
        <div class="card-body p-3">
          <h3 class="font-semibold">{{ item.name }}</h3>
          <p v-if="item.description" class="text-xs opacity-70 whitespace-pre-line">{{ item.description }}</p>
          <TracksSongList
            :songs="item.tracks"
            :item-name="item.name"
            :item-id="item.id"
            :category-name="detail.name"
            :category-id="detail.id"
          />
        </div>
      </article>
      <p v-if="!detail.items.length" class="text-center opacity-60 py-8">No items yet</p>
    </div>
  </UiBaseDialog>
</template>

<script setup lang="ts">
import type { PublicCategorySummary } from "#shared/contracts";
import type { PublicCategoryDetail } from "~/services/discovery";

defineProps<{
  summary: PublicCategorySummary | null;
  detail: PublicCategoryDetail | null;
  loading?: boolean;
  loadError?: string;
  loggedIn?: boolean;
  importing?: boolean;
  mutationError?: string;
  message?: string;
}>();
const emit = defineEmits<{ close: []; retry: []; import: [] }>();
</script>
