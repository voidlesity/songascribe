<template>
  <div class="max-w-6xl mx-auto">
    <header class="flex items-start gap-2 mb-4 flex-wrap">
      <div class="flex-1 min-w-0">
        <h1 class="text-2xl font-semibold truncate">{{ category.name }}</h1>
        <p v-if="category.description" class="text-sm opacity-80 whitespace-pre-line mt-1">
          {{ category.description }}
        </p>
        <p class="text-sm opacity-60 mt-1">
          {{ category.items.length }} {{ category.items.length === 1 ? "item" : "items" }}
        </p>
      </div>

      <div class="join">
        <button
          class="btn btn-sm join-item"
          :class="category.isPublic ? 'btn-success' : 'btn-ghost'"
          :disabled="mutating"
          :title="category.isPublic ? 'Make private' : 'Make public'"
          @click="emit('toggle-public')"
        >
          <Icon :name="category.isPublic ? 'mdi:earth' : 'mdi:lock'" />
          {{ category.isPublic ? "Public" : "Private" }}
        </button>
        <button class="btn btn-sm join-item" title="Share" :disabled="mutating" @click="emit('share')">
          <Icon name="mdi:share-variant" />
        </button>
        <button class="btn btn-sm join-item" title="Edit category" :disabled="mutating" @click="emit('edit-category')">
          <Icon name="mdi:pencil" />
        </button>
      </div>

      <button class="btn btn-primary btn-sm hidden md:inline-flex" @click="emit('new-item')">
        <Icon name="mdi:plus" /> New item
      </button>
    </header>

    <p v-if="mutationError" class="alert alert-error text-sm mb-4">{{ mutationError }}</p>

    <div v-if="category.items.length" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <article v-for="(item, index) in category.items" :key="item.id" class="card card-border bg-base-100">
        <div class="card-body p-4">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="min-w-0 flex-1">
              <h2 class="font-semibold truncate">{{ item.name }}</h2>
              <p v-if="item.description" class="text-xs opacity-70 whitespace-pre-line mt-1">
                {{ item.description }}
              </p>
            </div>
            <div class="join shrink-0">
              <button
                class="btn btn-ghost btn-xs join-item"
                :disabled="mutating || index === 0"
                :aria-label="`Move ${item.name} up`"
                @click="emit('move-item', index, -1)"
              >
                <Icon name="mdi:arrow-up" />
              </button>
              <button
                class="btn btn-ghost btn-xs join-item"
                :disabled="mutating || index === category.items.length - 1"
                :aria-label="`Move ${item.name} down`"
                @click="emit('move-item', index, 1)"
              >
                <Icon name="mdi:arrow-down" />
              </button>
              <button class="btn btn-ghost btn-xs join-item" :aria-label="`Edit ${item.name}`" @click="emit('edit-item', item)">
                <Icon name="mdi:pencil" />
              </button>
            </div>
          </div>
          <TracksSongList
            :songs="item.tracks"
            :item-name="item.name"
            :item-id="item.id"
            :category-name="category.name"
            :category-id="category.id"
            reorderable
            :reordering="mutating"
            @move="trackMoveHandler(item)"
          />
        </div>
      </article>
    </div>

    <div v-else class="card card-border bg-base-100 text-center py-12">
      <Icon name="mdi:music-note-plus" size="3rem" class="opacity-30 mx-auto mb-2" />
      <p class="opacity-60 mb-4">No items in this category yet</p>
      <button class="btn btn-primary btn-sm w-fit mx-auto" @click="emit('new-item')">
        <Icon name="mdi:plus" /> Add first item
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Category, Item } from "#shared/contracts";

defineProps<{ category: Category; mutating?: boolean; mutationError?: string }>();
const emit = defineEmits<{
  "toggle-public": [];
  share: [];
  "edit-category": [];
  "new-item": [];
  "edit-item": [item: Item];
  "move-item": [index: number, direction: -1 | 1];
  "move-track": [item: Item, index: number, direction: -1 | 1];
}>();

function trackMoveHandler(item: Item) {
  return (index: number, direction: -1 | 1) => {
    emit("move-track", item, index, direction);
  };
}
</script>
