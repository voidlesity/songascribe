<template>
  <div>
    <CatalogWorkspace
      :categories="categories"
      :current="current"
      :loading="loading"
      :load-error="loadError"
      :mutating="mutating"
      :mutation-error="mutationError"
      @select="selectedId = $event"
      @retry="reload()"
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
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
useSeoMeta({ title: "Library · Songascribe" });

const {
  categories,
  loading,
  error: loadError,
  refresh,
  updateCategory,
  reorderItems,
  reorderTracks,
} = useCategories();
const { refresh: reload } = await useAsyncData("catalog-library", () =>
  refresh(),
);

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

const current = computed<Category | null>(
  () =>
    categories.value.find((category) => category.id === selectedId.value) ??
    categories.value[0] ??
    null,
);

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
  const category = current.value;
  if (!category) return;
  return runMutation(
    () => updateCategory(category.id, { isPublic: !category.isPublic }),
    "Failed to update category visibility",
  );
}

function openShare() {
  const category = current.value;
  if (!category) return;
  return runMutation(async () => {
    share.value = await $fetch<Share>(`/api/categories/${category.id}/share`, {
      method: "POST",
    });
    sharingCategoryId.value = category.id;
    showShareDialog.value = true;
  }, "Failed to create share link");
}

function moveItem(index: number, direction: -1 | 1) {
  const category = current.value;
  if (!category) return;
  const target = index + direction;
  if (target < 0 || target >= category.items.length) return;
  const ids = category.items.map((item) => item.id);
  [ids[index], ids[target]] = [ids[target]!, ids[index]!];
  return runMutation(
    () => reorderItems(category.id, ids),
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
