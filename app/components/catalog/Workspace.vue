<template>
  <div class="drawer md:drawer-open">
    <input
      id="cat-drawer"
      v-model="drawerOpen"
      type="checkbox"
      class="drawer-toggle"
    />

    <div class="drawer-content flex flex-col">
      <div
        class="md:hidden bg-base-100 border-b border-base-300 px-4 py-2 flex items-center gap-2"
      >
        <label
          for="cat-drawer"
          class="btn btn-ghost btn-sm btn-square"
          aria-label="Open categories"
        >
          <Icon name="mdi:menu" />
        </label>
        <span class="font-medium truncate flex-1">{{
          current?.name ?? "Songascribe"
        }}</span>
        <button
          class="btn btn-primary btn-sm btn-square"
          aria-label="New item"
          @click="emit('new-item')"
        >
          <Icon name="mdi:plus" />
        </button>
      </div>

      <section class="flex-1 p-4 md:p-6">
        <div
          v-if="loading && !categories.length"
          class="flex justify-center py-20"
        >
          <span class="loading loading-spinner loading-lg" />
        </div>
        <div
          v-else-if="loadError && !categories.length"
          class="max-w-md mx-auto text-center py-16"
        >
          <Icon
            name="mdi:alert-circle-outline"
            size="3rem"
            class="text-error opacity-60 mx-auto mb-3"
          />
          <p class="mb-4">{{ loadError }}</p>
          <button class="btn btn-primary btn-sm" @click="emit('retry')">
            Retry
          </button>
        </div>
        <CatalogCategoryPanel
          v-else-if="current"
          :category="current"
          :mutating="mutating"
          :mutation-error="mutationError"
          @toggle-public="emit('toggle-public')"
          @share="emit('share')"
          @edit-category="emit('edit-category')"
          @new-item="emit('new-item')"
          @edit-item="emit('edit-item', $event)"
          @move-item="(index, direction) => emit('move-item', index, direction)"
          @move-track="
            (item, index, direction) =>
              emit('move-track', item, index, direction)
          "
        />
        <div v-else class="max-w-md mx-auto text-center py-16">
          <Icon
            name="mdi:bookmark-music"
            size="4rem"
            class="opacity-30 mx-auto mb-4"
          />
          <h2 class="text-xl font-semibold mb-2">Welcome to Songascribe</h2>
          <p class="opacity-60 mb-4">
            Create your first category to start tying songs to things.
          </p>
          <button class="btn btn-primary" @click="emit('new-category')">
            <Icon name="mdi:plus" /> Create category
          </button>
        </div>
      </section>
    </div>

    <CatalogSidebar
      :categories="categories"
      :selected-id="current?.id ?? null"
      @select="select"
      @new="emit('new-category')"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  categories: Category[];
  current: Category | null;
  loading?: boolean;
  loadError?: string;
  mutating?: boolean;
  mutationError?: string;
}>();
const emit = defineEmits<{
  select: [id: number];
  retry: [];
  "new-category": [];
  "edit-category": [];
  "new-item": [];
  "edit-item": [item: Item];
  "toggle-public": [];
  share: [];
  "move-item": [index: number, direction: -1 | 1];
  "move-track": [item: Item, index: number, direction: -1 | 1];
}>();
const drawerOpen = ref(false);

function select(id: number) {
  emit("select", id);
  drawerOpen.value = false;
}
</script>
