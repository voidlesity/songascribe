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
        <label for="cat-drawer" class="btn btn-ghost btn-sm btn-square">
          <Icon name="mdi:menu" />
        </label>
        <span class="font-medium truncate flex-1">
          {{ current?.name ?? "Songascribe" }}
        </span>
        <button class="btn btn-primary btn-sm btn-square" @click="openNewItem">
          <Icon name="mdi:plus" />
        </button>
      </div>

      <section class="flex-1 p-4 md:p-6">
        <div v-if="current" class="max-w-6xl mx-auto">
          <header class="flex items-center gap-2 mb-4 flex-wrap">
            <div class="flex-1 min-w-0">
              <h1 class="text-2xl font-semibold truncate">
                {{ current.name }}
              </h1>
              <p class="text-sm opacity-60">
                {{ current.items.length }}
                {{ current.items.length === 1 ? "item" : "items" }}
              </p>
            </div>

            <div class="join">
              <button
                class="btn btn-sm join-item"
                :class="current.isPublic ? 'btn-success' : 'btn-ghost'"
                :title="current.isPublic ? 'Public' : 'Private'"
                @click="togglePublic(current)"
              >
                <Icon :name="current.isPublic ? 'mdi:earth' : 'mdi:lock'" />
                {{ current.isPublic ? "Public" : "Private" }}
              </button>
              <button
                class="btn btn-sm join-item"
                title="Share"
                @click="share(current)"
              >
                <Icon name="mdi:share-variant" />
              </button>
              <button
                class="btn btn-sm join-item"
                title="Edit category"
                @click="openEditCategory(current)"
              >
                <Icon name="mdi:pencil" />
              </button>
            </div>

            <button
              class="btn btn-primary btn-sm hidden md:inline-flex"
              @click="openNewItem"
            >
              <Icon name="mdi:plus" /> New item
            </button>
          </header>

          <div
            v-if="current.items.length"
            class="grid grid-cols-1 lg:grid-cols-2 gap-3"
          >
            <article
              v-for="item in current.items"
              :key="item.id"
              class="card card-border bg-base-100"
            >
              <div class="card-body p-4">
                <div class="flex items-center justify-between gap-2 mb-2">
                  <h2 class="font-semibold truncate">{{ item.name }}</h2>
                  <button
                    class="btn btn-ghost btn-xs btn-square"
                    @click="openEditItem(item)"
                  >
                    <Icon name="mdi:pencil" />
                  </button>
                </div>
                <SongList :songs="item.tracks" :item-name="item.name" />
              </div>
            </article>
          </div>

          <div v-else class="card card-border bg-base-100 text-center py-12">
            <Icon
              name="mdi:music-note-plus"
              size="3rem"
              class="opacity-30 mx-auto mb-2"
            />
            <p class="opacity-60 mb-4">No items in this category yet</p>
            <button
              class="btn btn-primary btn-sm w-fit mx-auto"
              @click="openNewItem"
            >
              <Icon name="mdi:plus" /> Add first item
            </button>
          </div>
        </div>

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
          <button class="btn btn-primary" @click="openNewCategory">
            <Icon name="mdi:plus" /> Create category
          </button>
        </div>
      </section>
    </div>

    <aside class="drawer-side z-30 top-16!" :class="sidebarHeightClass">
      <label
        for="cat-drawer"
        aria-label="close sidebar"
        class="drawer-overlay"
      />
      <div
        class="bg-base-100 border-r border-base-300 w-72 h-full flex flex-col"
      >
        <div
          class="p-3 border-b border-base-300 flex items-center gap-2 shrink-0"
        >
          <span class="text-xs uppercase opacity-60 flex-1 font-medium">
            Categories
          </span>
          <button
            class="btn btn-ghost btn-xs btn-square"
            title="New category"
            @click="openNewCategory"
          >
            <Icon name="mdi:plus" />
          </button>
        </div>

        <ul class="menu menu-sm p-2 flex-1 overflow-y-auto">
          <li v-for="c in categories" :key="c.id">
            <button
              class="justify-between"
              :class="{ 'menu-active': c.id === current?.id }"
              @click="pickCategory(c.id)"
            >
              <span class="truncate flex items-center gap-2">
                <Icon
                  :name="c.isPublic ? 'mdi:earth' : 'mdi:folder'"
                  class="opacity-70"
                />
                {{ c.name }}
              </span>
              <span class="badge badge-ghost badge-sm">{{
                c.items.length
              }}</span>
            </button>
          </li>
          <li v-if="!categories.length" class="text-xs opacity-50 p-3">
            No categories yet
          </li>
        </ul>
      </div>
    </aside>

    <CategoryDialog
      :open="showCategoryDialog"
      :category="editingCategory"
      @close="showCategoryDialog = false"
      @deleted="selectedId = null"
    />

    <ItemDialog
      :open="showItemDialog"
      :item="editingItem"
      :categories="categories"
      :default-category-id="current?.id ?? null"
      @close="showItemDialog = false"
    />

    <ShareDialog
      :open="showShareDialog"
      :url="shareUrl"
      @close="showShareDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { Category, Item } from "~/composables/useCategories";

definePageMeta({ middleware: ["logged-in"] });

const { categories, refresh, updateCategory, createShare } = useCategories();
const { currentSong } = usePlayerStore();

// The sidebar is sticky below the fixed header and spans to the bottom (or to
// the music player bar when a song is loaded). Its own list scrolls
// independently of the item grid.
const sidebarHeightClass = computed(() =>
  currentSong.value
    ? "max-md:h-[calc(100dvh-4rem)]! md:h-[calc(100dvh-7.5rem)]!"
    : "h-[calc(100dvh-4rem)]!",
);

const selectedId = ref<number | null>(null);
const drawerOpen = ref(false);

const showCategoryDialog = ref(false);
const editingCategory = ref<Category | null>(null);
const showItemDialog = ref(false);
const editingItem = ref<Item | null>(null);
const showShareDialog = ref(false);
const shareUrl = ref("");

const current = computed<Category | null>(() => {
  if (!categories.value.length) return null;
  return (
    categories.value.find((c) => c.id === selectedId.value) ??
    categories.value[0] ??
    null
  );
});

watch(categories, (cats) => {
  if (!cats.length) {
    selectedId.value = null;
  } else if (!cats.some((c) => c.id === selectedId.value)) {
    selectedId.value = cats[0]!.id;
  }
});

function pickCategory(id: number) {
  selectedId.value = id;
  drawerOpen.value = false;
}

function openNewCategory() {
  editingCategory.value = null;
  showCategoryDialog.value = true;
}

function openEditCategory(c: Category) {
  editingCategory.value = c;
  showCategoryDialog.value = true;
}

function openNewItem() {
  if (!categories.value.length) {
    openNewCategory();
    return;
  }
  editingItem.value = null;
  showItemDialog.value = true;
}

function openEditItem(item: Item) {
  editingItem.value = item;
  showItemDialog.value = true;
}

async function togglePublic(c: Category) {
  await updateCategory(c.id, { isPublic: !c.isPublic });
}

async function share(c: Category) {
  const result = await createShare(c.id);
  shareUrl.value = window.location.origin + result.url;
  showShareDialog.value = true;
}

onMounted(refresh);
</script>
