<template>
  <CatalogWorkspace
    :categories="categories"
    :current="current"
    :loading="loading"
    :load-error="loadError"
    :mutating="mutating"
    :mutation-error="mutationError"
    :player-visible="!!currentSong"
    @select="selectedId = $event"
    @retry="retryLoad"
    @new-category="openNewCategory"
    @edit-category="openEditCategory"
    @new-item="openNewItem"
    @edit-item="openEditItem"
    @toggle-public="togglePublic"
    @share="openShare"
    @move-item="moveItem"
    @move-track="moveTrack"
  />

  <CatalogCategoryDialog
    :open="showCategoryDialog"
    :category="editingCategory"
    @close="showCategoryDialog = false"
    @deleted="selectedId = null"
  />
  <CatalogItemDialog
    :open="showItemDialog"
    :item="editingItem"
    :categories="categories"
    :default-category-id="current?.id ?? null"
    @close="showItemDialog = false"
  />
  <CatalogShareDialog
    :open="showShareDialog"
    :category-id="sharingCategoryId"
    :initial-share="share"
    @close="showShareDialog = false"
    @updated="share = $event"
    @revoked="share = null"
  />
</template>

<script setup lang="ts">
import type { Category, Item, Share } from "#shared/contracts";
import { getApiErrorMessage } from "~/services/api";

definePageMeta({ middleware: ["auth"] });
useSeoMeta({ title: "Library · Songascribe" });

const store = useCategories();
const { categories, loading, refresh, updateCategory, reorderItems, reorderTracks } = store;
const requestFetch = useRequestFetch();
const { error: asyncError, refresh: reload } = await useAsyncData(
  "catalog-library",
  () => refresh(requestFetch),
);
const { currentSong } = usePlayerStore();

const selectedId = ref<number | null>(null);
const showCategoryDialog = ref(false);
const editingCategory = ref<Category | null>(null);
const showItemDialog = ref(false);
const editingItem = ref<Item | null>(null);
const showShareDialog = ref(false);
const sharingCategoryId = ref<number | null>(null);
const share = ref<Share | null>(null);
const mutating = ref(false);
const mutationError = ref("");
function retryLoad() {
  return reload();
}

const loadError = computed(
  () => store.error.value || (asyncError.value ? "Failed to load your library" : ""),
);

const current = computed<Category | null>(() => {
  if (!categories.value.length) return null;
  return categories.value.find((category) => category.id === selectedId.value) ?? categories.value[0] ?? null;
});

watch(
  categories,
  (entries) => {
    if (!entries.length) selectedId.value = null;
    else if (!entries.some((category) => category.id === selectedId.value)) {
      selectedId.value = entries[0]!.id;
    }
  },
  { immediate: true },
);

function openNewCategory() {
  editingCategory.value = null;
  showCategoryDialog.value = true;
}
function openEditCategory() {
  editingCategory.value = current.value;
  showCategoryDialog.value = true;
}
function openNewItem() {
  if (!categories.value.length) return openNewCategory();
  editingItem.value = null;
  showItemDialog.value = true;
}
function openEditItem(item: Item) {
  editingItem.value = item;
  showItemDialog.value = true;
}

async function runMutation(action: () => Promise<unknown>, fallback: string) {
  mutating.value = true;
  mutationError.value = "";
  try {
    await action();
  } catch (cause) {
    mutationError.value = getApiErrorMessage(cause, fallback);
  } finally {
    mutating.value = false;
  }
}

function togglePublic() {
  if (!current.value) return;
  const category = current.value;
  return runMutation(
    () => updateCategory(category.id, { isPublic: !category.isPublic }),
    "Failed to update category visibility",
  );
}

async function openShare() {
  if (!current.value) return;
  const categoryId = current.value.id;
  await runMutation(async () => {
    share.value = await store.createShare(categoryId);
    sharingCategoryId.value = categoryId;
    showShareDialog.value = true;
  }, "Failed to create share link");
}

function moveItem(index: number, direction: -1 | 1) {
  if (!current.value) return;
  const target = index + direction;
  if (target < 0 || target >= current.value.items.length) return;
  const ids = current.value.items.map((item) => item.id);
  [ids[index], ids[target]] = [ids[target]!, ids[index]!];
  return runMutation(
    () => reorderItems(current.value!.id, ids),
    "Failed to reorder items",
  );
}

function moveTrack(item: Item, index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= item.tracks.length) return;
  const ids = item.tracks.map((track) => track.id);
  [ids[index], ids[target]] = [ids[target]!, ids[index]!];
  return runMutation(
    () => reorderTracks(item.id, ids),
    "Failed to reorder tracks",
  );
}
</script>
