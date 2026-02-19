<template>
  <div class="min-h-screen bg-base-200">
    <!-- Add/Edit Item Dialog -->
    <dialog v-if="showItemDialog" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <h3 class="text-2xl font-bold mb-4">
          {{ editingItem ? "Edit Item" : "Add New Item" }}
        </h3>
        <form @submit.prevent="saveItem">
          <div
            v-if="!editingItem && categories.length === 0"
            class="alert alert-warning mb-4"
          >
            <Icon name="ic:round-warning" size="1.5rem" />
            <span>Please create a category first before adding items.</span>
          </div>

          <div v-if="!editingItem" class="form-control mb-4">
            <label class="label">
              <span class="label-text font-semibold">Category</span>
            </label>
            <select
              v-model="itemForm.categoryId"
              class="select select-bordered w-full"
              required
            >
              <option disabled :value="null">Select a category</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text font-semibold">Item Name</span>
            </label>
            <input
              v-model="itemForm.name"
              type="text"
              placeholder="e.g., Lola, Beach Resort"
              class="input input-bordered w-full"
              required
            />
          </div>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text font-semibold">Songs</span>
            </label>

            <!-- Song Search -->
            <div class="mb-3">
              <div class="join w-full">
                <input
                  v-model="songSearchQuery"
                  type="text"
                  placeholder="Search for songs..."
                  class="input input-bordered join-item flex-1"
                  @input="debouncedSearch"
                />
                <button
                  type="button"
                  class="btn join-item"
                  @click="searchSongs"
                >
                  <Icon name="ic:baseline-search" size="1.2rem" />
                </button>
              </div>

              <!-- Search Results -->
              <div
                v-if="searchResults.length > 0"
                class="mt-2 max-h-60 overflow-y-auto bg-base-100 rounded-lg border border-base-300"
              >
                <div
                  v-for="track in searchResults"
                  :key="track.encoded"
                  class="flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer transition-all"
                  @click="addSearchResult(track)"
                >
                  <img
                    v-if="track.info?.artworkUrl"
                    :src="track.info.artworkUrl"
                    alt="Album art"
                    class="w-10 h-10 rounded"
                  />
                  <div
                    v-else
                    class="w-10 h-10 rounded bg-base-300 flex items-center justify-center"
                  >
                    <Icon name="ic:round-library-music" size="1rem" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold truncate">
                      {{ track.info?.title }}
                    </div>
                    <div class="text-sm opacity-70 truncate">
                      {{ track.info?.author }}
                    </div>
                  </div>
                  <Icon
                    name="ic:round-add"
                    size="1.5rem"
                    class="text-primary"
                  />
                </div>
              </div>
              <div v-else-if="isSearching" class="mt-2 text-center py-4">
                <span class="loading loading-spinner loading-sm"></span>
              </div>
            </div>

            <div class="divider">OR Resolve URL</div>

            <!-- Manual URL resolve -->
            <div class="flex gap-2 items-end mb-3">
              <div class="flex-1">
                <input
                  v-model="manualUrl"
                  type="text"
                  placeholder="Paste a track URL to resolve..."
                  class="input input-bordered input-sm w-full"
                />
              </div>
              <button
                type="button"
                class="btn btn-sm btn-outline"
                :disabled="!manualUrl || isResolvingUrl"
                @click="resolveManualUrl"
              >
                <span
                  v-if="isResolvingUrl"
                  class="loading loading-spinner loading-xs"
                ></span>
                <Icon v-else name="ic:round-search" size="1rem" />
                Resolve
              </button>
            </div>

            <!-- Added Songs List -->
            <div v-if="itemForm.songs.length > 0" class="space-y-2">
              <div
                v-for="(song, idx) in itemForm.songs"
                :key="song.encoded || idx"
                class="flex items-center gap-3 p-3 bg-base-200 rounded-lg"
              >
                <img
                  v-if="song.info?.artworkUrl"
                  :src="song.info.artworkUrl"
                  alt="Album art"
                  class="w-10 h-10 rounded"
                />
                <div
                  v-else
                  class="w-10 h-10 rounded bg-base-300 flex items-center justify-center"
                >
                  <Icon name="ic:round-library-music" size="1rem" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate text-sm">
                    {{ song.info?.title || "Unknown track" }}
                  </div>
                  <div class="text-xs opacity-70 truncate">
                    {{ song.info?.author || "Unknown artist" }}
                  </div>
                </div>
                <button
                  type="button"
                  class="btn btn-error btn-sm btn-circle"
                  @click="removeSong(idx)"
                >
                  <Icon name="ic:round-close" size="1.2rem" />
                </button>
              </div>
            </div>
            <div v-else class="text-center py-4 opacity-50 text-sm">
              No songs added yet. Use search or resolve a URL above.
            </div>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeItemDialog">
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="
                !itemForm.name ||
                itemForm.songs.length === 0 ||
                (!editingItem && !itemForm.categoryId)
              "
            >
              {{ editingItem ? "Update" : "Create" }}
            </button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" @click="closeItemDialog"></div>
    </dialog>

    <!-- Create Category Dialog -->
    <dialog v-if="showCategoryDialog" class="modal modal-open">
      <div class="modal-box">
        <h3 class="text-2xl font-bold mb-4">Create New Category</h3>
        <form @submit.prevent="createCategory">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text font-semibold">Category Name</span>
            </label>
            <input
              v-model="categoryForm.name"
              type="text"
              placeholder="e.g., Characters, Places"
              class="input input-bordered w-full"
              required
            />
          </div>
          <div class="form-control mb-4">
            <label class="label cursor-pointer">
              <span class="label-text font-semibold"
                >Make this category public</span
              >
              <input
                v-model="categoryForm.isPublic"
                type="checkbox"
                class="toggle toggle-primary"
              />
            </label>
            <p class="text-xs opacity-70 mt-1">
              Public categories can be discovered by others
            </p>
          </div>
          <div class="modal-action">
            <button type="button" class="btn" @click="closeCategoryDialog">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">Create</button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" @click="closeCategoryDialog"></div>
    </dialog>

    <!-- Share Dialog -->
    <dialog v-if="showShareDialog" class="modal modal-open">
      <div class="modal-box">
        <h3 class="text-2xl font-bold mb-4">Share Category</h3>
        <p class="mb-4 text-sm opacity-70">
          Share this link with your friends to let them view your "{{
            selectedCategory?.name
          }}" category.
        </p>
        <div class="form-control mb-4">
          <div class="join w-full">
            <input
              :value="shareUrl"
              type="text"
              class="input input-bordered join-item flex-1"
              readonly
            />
            <button class="btn btn-primary join-item" @click="copyShareLink">
              <Icon name="ic:round-content-copy" size="1.2rem" />
              Copy
            </button>
          </div>
        </div>
        <div class="modal-action">
          <button class="btn" @click="closeShareDialog">Close</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeShareDialog"></div>
    </dialog>

    <!-- Quick Add Song Dialog -->
    <dialog v-if="showQuickAddDialog" class="modal modal-open">
      <div class="modal-box">
        <h3 class="text-2xl font-bold mb-4">Add Song</h3>
        <div v-if="selectedTrack" class="mb-4">
          <div class="flex items-center gap-3 p-3 bg-base-200 rounded-box">
            <img
              v-if="selectedTrack.info?.artworkUrl"
              :src="selectedTrack.info.artworkUrl"
              alt="Album art"
              class="w-16 h-16 rounded"
            />
            <div
              v-else
              class="w-16 h-16 rounded bg-base-300 flex items-center justify-center"
            >
              <Icon name="ic:round-library-music" size="1.5rem" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold truncate">
                {{ selectedTrack.info?.title }}
              </div>
              <div class="text-sm opacity-70 truncate">
                {{ selectedTrack.info?.author }}
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Add to Existing Item -->
          <div v-if="categories.length > 0">
            <h4 class="font-semibold mb-2">Add to Existing Item</h4>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="category in categories"
                :key="category.id"
                class="space-y-1"
              >
                <div class="text-sm font-medium opacity-70">
                  {{ category.name }}
                </div>
                <button
                  v-for="item in category.items"
                  :key="item.id"
                  class="btn btn-sm btn-ghost w-full justify-start"
                  @click="addToExistingItem(item.id)"
                >
                  <Icon name="ic:round-library-music" size="1rem" />
                  {{ item.name }}
                </button>
              </div>
            </div>
          </div>

          <div class="divider">OR</div>

          <!-- Create New Item -->
          <div>
            <h4 class="font-semibold mb-2">Create New Item</h4>
            <div class="form-control mb-3">
              <input
                v-model="quickAddItemName"
                type="text"
                placeholder="Item name (e.g., Hero Theme)"
                class="input input-bordered"
              />
            </div>
            <div class="form-control mb-3">
              <select
                v-model="quickAddCategoryId"
                class="select select-bordered"
              >
                <option disabled :value="null">Select category</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <button
              class="btn btn-primary w-full"
              @click="createNewItemWithSong"
              :disabled="!quickAddItemName || !quickAddCategoryId"
            >
              <Icon name="ic:round-add" size="1.2rem" />
              Create Item with Song
            </button>
          </div>
        </div>

        <div class="modal-action">
          <button class="btn" @click="closeQuickAddDialog">Cancel</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeQuickAddDialog"></div>
    </dialog>

    <!-- Category Management Dialog -->
    <dialog v-if="showCategoryManageDialog" class="modal modal-open">
      <div class="modal-box">
        <h3 class="text-2xl font-bold mb-4">Manage Category</h3>
        <form @submit.prevent="updateCategory">
          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text font-semibold">Category Name</span>
            </label>
            <input
              v-model="categoryManageForm.name"
              type="text"
              placeholder="Category name"
              class="input input-bordered w-full"
              required
            />
          </div>
          <div class="form-control mb-4">
            <label class="label cursor-pointer">
              <span class="label-text font-semibold"
                >Make this category public</span
              >
              <input
                v-model="categoryManageForm.isPublic"
                type="checkbox"
                class="toggle toggle-primary"
              />
            </label>
          </div>
          <div class="modal-action">
            <button type="button" class="btn btn-error" @click="deleteCategory">
              <Icon name="ic:round-delete" size="1.2rem" />
              Delete
            </button>
            <button
              type="button"
              class="btn"
              @click="closeCategoryManageDialog"
            >
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">Update</button>
          </div>
        </form>
      </div>
      <div class="modal-backdrop" @click="closeCategoryManageDialog"></div>
    </dialog>

    <!-- Main Content -->
    <div class="container mx-auto p-4 max-w-7xl">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-4">
          <div class="relative flex-1">
            <Icon
              name="ic:baseline-search"
              size="1.5rem"
              class="absolute left-4 top-1/2 -translate-y-1/2 opacity-50"
            />
            <input
              v-model="mainSearchQuery"
              type="search"
              class="input input-lg w-full pl-12 pr-4 rounded-full shadow-lg border-2 border-base-300 focus:border-primary"
              placeholder="Search for songs to add..."
              @input="debouncedMainSearch"
              @focus="showMainSearchResults = true"
            />

            <!-- Main Search Results Dropdown -->
            <div
              v-if="showMainSearchResults && mainSearchResults.length > 0"
              class="absolute top-full left-0 right-0 mt-2 bg-base-100 rounded-box shadow-2xl border border-base-300 max-h-96 overflow-y-auto z-50"
            >
              <div
                v-for="track in mainSearchResults"
                :key="track.encoded"
                class="flex items-center gap-3 p-3 hover:bg-base-200 cursor-pointer transition-all border-b border-base-300 last:border-b-0"
                @click="openQuickAddDialog(track)"
              >
                <img
                  v-if="track.info?.artworkUrl"
                  :src="track.info.artworkUrl"
                  alt="Album art"
                  class="w-12 h-12 rounded"
                />
                <div
                  v-else
                  class="w-12 h-12 rounded bg-base-300 flex items-center justify-center"
                >
                  <Icon name="ic:round-library-music" size="1.5rem" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate">
                    {{ track.info?.title }}
                  </div>
                  <div class="text-sm opacity-70 truncate">
                    {{ track.info?.author }}
                  </div>
                </div>
                <Icon
                  name="ic:round-add-circle"
                  size="1.5rem"
                  class="text-primary"
                />
              </div>
            </div>

            <!-- Click outside to close -->
            <div
              v-if="showMainSearchResults && mainSearchResults.length > 0"
              class="fixed inset-0 z-40"
              @click="closeMainSearch"
            ></div>
          </div>
          <button
            class="btn btn-primary btn-lg btn-circle shadow-lg"
            @click="openItemDialog()"
            :disabled="categories.length === 0"
            :title="
              categories.length === 0
                ? 'Create a category first'
                : 'Add new item'
            "
          >
            <Icon name="ic:round-plus" size="1.5rem" />
          </button>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="bg-base-100 rounded-3xl shadow-xl p-6 mb-6">
        <div class="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            v-for="(cat, idx) in categories"
            :key="cat.id"
            class="btn rounded-full px-6 flex items-center gap-2"
            :class="idx === selectedTabIndex ? 'btn-primary' : 'btn-ghost'"
            @click="selectedTabIndex = idx"
          >
            {{ cat.name }}
            <Icon
              v-if="cat.is_public"
              name="ic:round-public"
              size="1rem"
              class="opacity-70"
            />
          </button>
          <button
            class="btn btn-ghost btn-circle"
            @click="showCategoryDialog = true"
          >
            <Icon name="ic:round-plus" size="1.5rem" />
          </button>
          <div v-if="currentCategory" class="ml-auto flex gap-2">
            <button
              class="btn btn-ghost btn-circle"
              @click="openCategoryManageDialog(currentCategory)"
              title="Manage category"
            >
              <Icon name="ic:round-edit" size="1.5rem" />
            </button>
            <button
              class="btn btn-ghost btn-circle"
              @click="toggleCategoryPublic"
              :title="
                currentCategory.is_public ? 'Make Private' : 'Make Public'
              "
            >
              <Icon
                :name="
                  currentCategory.is_public
                    ? 'ic:round-public'
                    : 'ic:round-lock'
                "
                size="1.5rem"
              />
            </button>
            <button
              class="btn btn-ghost btn-circle"
              @click="openShareDialog(currentCategory)"
            >
              <Icon name="ic:round-share" size="1.5rem" />
            </button>
          </div>
        </div>
      </div>

      <!-- Items Grid -->
      <div v-if="currentCategory" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="card bg-base-100 shadow-xl rounded-3xl hover:shadow-2xl transition-all"
        >
          <div class="card-body p-6">
            <div class="flex items-start justify-between mb-4">
              <h2 class="card-title text-2xl">{{ item.name }}</h2>
              <div class="flex gap-1">
                <button
                  class="btn btn-ghost btn-sm btn-circle"
                  @click="openItemDialog(item)"
                >
                  <Icon name="ic:round-edit" size="1.2rem" />
                </button>
                <button
                  class="btn btn-ghost btn-sm btn-circle text-error"
                  @click="deleteItem(item.id)"
                >
                  <Icon name="ic:round-delete" size="1.2rem" />
                </button>
              </div>
            </div>

            <!-- Custom Music Player -->
            <MusicPlayer v-if="item.songs.length > 0" :songs="item.songs" />

            <!-- No Songs -->
            <div v-else class="text-center py-4 opacity-50">
              No songs added yet
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="categories.length === 0" class="text-center py-20">
        <Icon
          name="ic:round-library-music"
          size="4rem"
          class="opacity-30 mx-auto mb-4"
        />
        <h3 class="text-2xl font-bold mb-2">No Categories Yet</h3>
        <p class="opacity-70 mb-4">Create your first category to get started</p>
        <button class="btn btn-primary" @click="showCategoryDialog = true">
          <Icon name="ic:round-plus" size="1.2rem" />
          Create Category
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const { loggedIn } = useUserSession();

// State
const categories = ref([]);
const selectedTabIndex = ref(0);
const searchQuery = ref("");
const loading = ref(true);

// Dialogs
const showItemDialog = ref(false);
const showCategoryDialog = ref(false);
const showShareDialog = ref(false);
const showCategoryManageDialog = ref(false);
const showQuickAddDialog = ref(false);
const editingItem = ref(null);

// Forms
const itemForm = ref({
  name: "",
  categoryId: null,
  songs: [],
});

const categoryForm = ref({
  name: "",
  isPublic: false,
});

const categoryManageForm = ref({
  id: null,
  name: "",
  isPublic: false,
});

const shareUrl = ref("");
const selectedCategory = ref(null);

// Song Search (in item dialog)
const songSearchQuery = ref("");
const searchResults = ref([]);
const isSearching = ref(false);
let searchTimeout = null;

// Manual URL resolve
const manualUrl = ref("");
const isResolvingUrl = ref(false);

// Main Search Bar
const mainSearchQuery = ref("");
const mainSearchResults = ref([]);
const isMainSearching = ref(false);
const showMainSearchResults = ref(false);
let mainSearchTimeout = null;

// Quick Add Dialog
const selectedTrack = ref(null);
const quickAddItemName = ref("");
const quickAddCategoryId = ref(null);

// Computed
const currentCategory = computed(
  () => categories.value[selectedTabIndex.value] || null,
);

const filteredItems = computed(() => {
  if (!currentCategory.value) return [];
  return currentCategory.value.items;
});

// Helper to extract tracks from Lavalink search result
function extractTracks(result) {
  if (!result) return [];
  if (result.loadType === "search" || result.loadType === "track") {
    if (Array.isArray(result.data)) {
      return result.data;
    }
    if (result.data?.tracks) {
      return result.data.tracks;
    }
    // Single track result
    if (result.data?.encoded) {
      return [result.data];
    }
  }
  if (result.loadType === "playlist" && result.data?.tracks) {
    return result.data.tracks;
  }
  return [];
}

// Methods
async function fetchCategories() {
  loading.value = true;
  try {
    const data = await $fetch("/api/categories");
    categories.value = data;
  } catch (error) {
    console.error("Error fetching categories:", error);
  } finally {
    loading.value = false;
  }
}

async function searchSongs() {
  if (!songSearchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  isSearching.value = true;
  try {
    const result = await $fetch(
      `/api/lavalink/search?q=${encodeURIComponent(songSearchQuery.value)}`,
    );
    searchResults.value = extractTracks(result);
  } catch (error) {
    console.error("Error searching songs:", error);
    searchResults.value = [];
  } finally {
    isSearching.value = false;
  }
}

function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    searchSongs();
  }, 500);
}

// Main search bar functions
async function searchMainSongs() {
  if (!mainSearchQuery.value.trim()) {
    mainSearchResults.value = [];
    showMainSearchResults.value = false;
    return;
  }

  isMainSearching.value = true;
  try {
    const result = await $fetch(
      `/api/lavalink/search?q=${encodeURIComponent(mainSearchQuery.value)}`,
    );
    mainSearchResults.value = extractTracks(result);
    showMainSearchResults.value = true;
  } catch (error) {
    console.error("Error searching songs:", error);
    mainSearchResults.value = [];
  } finally {
    isMainSearching.value = false;
  }
}

function debouncedMainSearch() {
  clearTimeout(mainSearchTimeout);
  mainSearchTimeout = setTimeout(() => {
    searchMainSongs();
  }, 500);
}

function closeMainSearch() {
  showMainSearchResults.value = false;
}

function openQuickAddDialog(track) {
  selectedTrack.value = track;
  quickAddItemName.value = "";
  quickAddCategoryId.value =
    currentCategory.value?.id || categories.value[0]?.id || null;
  showQuickAddDialog.value = true;
  closeMainSearch();
}

function closeQuickAddDialog() {
  showQuickAddDialog.value = false;
  selectedTrack.value = null;
  quickAddItemName.value = "";
  quickAddCategoryId.value = null;
  mainSearchQuery.value = "";
  mainSearchResults.value = [];
}

async function addToExistingItem(itemId) {
  if (!selectedTrack.value) return;

  try {
    // Find the item across all categories
    let item = null;
    for (const cat of categories.value) {
      item = cat.items.find((i) => i.id === itemId);
      if (item) break;
    }

    if (!item) {
      alert("Item not found");
      return;
    }

    // Add the new track to existing songs
    const updatedSongs = [...item.songs, selectedTrack.value];

    await $fetch(`/api/items/${itemId}`, {
      method: "PUT",
      body: {
        name: item.name,
        songs: updatedSongs,
      },
    });

    await fetchCategories();
    closeQuickAddDialog();
  } catch (error) {
    console.error("Error adding song to item:", error);
    alert("Failed to add song. Please try again.");
  }
}

async function createNewItemWithSong() {
  if (
    !selectedTrack.value ||
    !quickAddItemName.value ||
    !quickAddCategoryId.value
  )
    return;

  try {
    await $fetch("/api/items", {
      method: "POST",
      body: {
        name: quickAddItemName.value,
        categoryId: quickAddCategoryId.value,
        songs: [selectedTrack.value],
      },
    });

    await fetchCategories();
    closeQuickAddDialog();
  } catch (error) {
    console.error("Error creating item with song:", error);
    alert("Failed to create item. Please try again.");
  }
}

function addSearchResult(track) {
  // Add the full Lavalink track object
  itemForm.value.songs.push(track);

  // Clear search
  songSearchQuery.value = "";
  searchResults.value = [];
}

async function resolveManualUrl() {
  if (!manualUrl.value.trim()) return;

  isResolvingUrl.value = true;
  try {
    const result = await $fetch(
      `/api/lavalink/search?q=${encodeURIComponent(manualUrl.value)}`,
    );
    const tracks = extractTracks(result);
    if (tracks.length > 0) {
      itemForm.value.songs.push(tracks[0]);
      manualUrl.value = "";
    } else {
      alert("Could not resolve the URL. Please check the link and try again.");
    }
  } catch (error) {
    console.error("Error resolving URL:", error);
    alert("Failed to resolve URL. Please try again.");
  } finally {
    isResolvingUrl.value = false;
  }
}

function openItemDialog(item = null) {
  if (categories.value.length === 0 && !item) {
    alert("Please create a category first before adding items.");
    showCategoryDialog.value = true;
    return;
  }

  if (item) {
    editingItem.value = item;
    itemForm.value = {
      name: item.name,
      categoryId: currentCategory.value.id,
      songs: item.songs.map((s) => ({ ...s })),
    };
  } else {
    editingItem.value = null;
    itemForm.value = {
      name: "",
      categoryId: currentCategory.value?.id || categories.value[0]?.id || null,
      songs: [],
    };
  }
  manualUrl.value = "";
  showItemDialog.value = true;
}

function closeItemDialog() {
  showItemDialog.value = false;
  editingItem.value = null;
  itemForm.value = { name: "", categoryId: null, songs: [] };
  songSearchQuery.value = "";
  searchResults.value = [];
  manualUrl.value = "";
}

function removeSong(index) {
  itemForm.value.songs.splice(index, 1);
}

async function saveItem() {
  try {
    // Filter to only songs with encoded track data
    const validSongs = itemForm.value.songs.filter((s) => s.encoded);

    if (editingItem.value) {
      await $fetch(`/api/items/${editingItem.value.id}`, {
        method: "PUT",
        body: {
          name: itemForm.value.name,
          songs: validSongs,
        },
      });
    } else {
      await $fetch("/api/items", {
        method: "POST",
        body: {
          name: itemForm.value.name,
          categoryId: itemForm.value.categoryId,
          songs: validSongs,
        },
      });
    }

    await fetchCategories();
    closeItemDialog();
  } catch (error) {
    console.error("Error saving item:", error);
    alert("Failed to save item. Please try again.");
  }
}

async function deleteItem(itemId) {
  if (!confirm("Are you sure you want to delete this item?")) return;

  try {
    await $fetch(`/api/items/${itemId}`, { method: "DELETE" });
    await fetchCategories();
  } catch (error) {
    console.error("Error deleting item:", error);
    alert("Failed to delete item. Please try again.");
  }
}

function closeCategoryDialog() {
  showCategoryDialog.value = false;
  categoryForm.value = { name: "", isPublic: false };
}

async function createCategory() {
  try {
    await $fetch("/api/categories", {
      method: "POST",
      body: categoryForm.value,
    });

    await fetchCategories();
    closeCategoryDialog();
  } catch (error) {
    console.error("Error creating category:", error);
    alert("Failed to create category. Please try again.");
  }
}

async function toggleCategoryPublic() {
  if (!currentCategory.value) return;

  try {
    await $fetch(`/api/categories/${currentCategory.value.id}`, {
      method: "PUT",
      body: {
        isPublic: !currentCategory.value.is_public,
      },
    });

    await fetchCategories();
  } catch (error) {
    console.error("Error updating category:", error);
    alert("Failed to update category. Please try again.");
  }
}

function openCategoryManageDialog(category) {
  categoryManageForm.value = {
    id: category.id,
    name: category.name,
    isPublic: category.is_public || false,
  };
  showCategoryManageDialog.value = true;
}

function closeCategoryManageDialog() {
  showCategoryManageDialog.value = false;
  categoryManageForm.value = { id: null, name: "", isPublic: false };
}

async function updateCategory() {
  try {
    await $fetch(`/api/categories/${categoryManageForm.value.id}`, {
      method: "PUT",
      body: {
        name: categoryManageForm.value.name,
        isPublic: categoryManageForm.value.isPublic,
      },
    });

    await fetchCategories();
    closeCategoryManageDialog();
  } catch (error) {
    console.error("Error updating category:", error);
    alert("Failed to update category. Please try again.");
  }
}

async function deleteCategory() {
  if (
    !confirm(
      `Are you sure you want to delete "${categoryManageForm.value.name}"? This will delete all items and songs in this category.`,
    )
  ) {
    return;
  }

  try {
    await $fetch(`/api/categories/${categoryManageForm.value.id}`, {
      method: "DELETE",
    });

    await fetchCategories();
    closeCategoryManageDialog();
    selectedTabIndex.value = 0;
  } catch (error) {
    console.error("Error deleting category:", error);
    alert("Failed to delete category. Please try again.");
  }
}

async function openShareDialog(category) {
  selectedCategory.value = category;

  try {
    const result = await $fetch("/api/share/create", {
      method: "POST",
      body: { categoryId: category.id },
    });

    shareUrl.value = window.location.origin + result.shareUrl;
    showShareDialog.value = true;
  } catch (error) {
    console.error("Error creating share link:", error);
    alert("Failed to create share link. Please try again.");
  }
}

function closeShareDialog() {
  showShareDialog.value = false;
  selectedCategory.value = null;
  shareUrl.value = "";
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    alert("Link copied to clipboard!");
  } catch (error) {
    console.error("Error copying to clipboard:", error);
  }
}

// Load categories on mount
onMounted(() => {
  if (loggedIn.value) {
    fetchCategories();
  }
});

// Redirect to login if not logged in
watch(loggedIn, (value) => {
  if (!value) {
    navigateTo("/login");
  }
});
</script>
