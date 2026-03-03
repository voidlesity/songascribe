<template>
  <div class="min-h-screen bg-base-200">
    <div class="container mx-auto p-4 max-w-7xl">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-4xl font-bold mb-2">Browse Public Categories</h1>
        <p class="text-lg opacity-70">
          Discover categories shared by the community
        </p>
      </div>

      <!-- Search -->
      <div class="mb-6">
        <div class="relative">
          <Icon
            name="ic:baseline-search"
            size="1.5rem"
            class="absolute left-4 top-1/2 -translate-y-1/2 opacity-50"
          />
          <input
            v-model="searchQuery"
            type="search"
            class="input input-lg w-full pl-12 pr-4 rounded-full shadow-lg border-2 border-base-300 focus:border-primary"
            placeholder="Search public categories..."
            @input="debouncedSearch"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center min-h-100">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Categories Grid -->
      <div
        v-else-if="publicCategories.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <div
          v-for="category in publicCategories"
          :key="category.id"
          class="card bg-base-100 shadow-xl rounded-3xl hover:shadow-2xl transition-all cursor-pointer"
          @click="viewCategory(category)"
        >
          <div class="card-body p-6">
            <div class="flex items-start gap-3 mb-4">
              <div class="avatar">
                <div class="w-12 h-12 rounded-full">
                  <img
                    v-if="category.owner?.avatar"
                    :src="category.owner.avatar"
                    :alt="category.owner.name"
                  />
                  <div
                    v-else
                    class="bg-base-300 w-full h-full flex items-center justify-center"
                  >
                    <Icon name="ic:round-person" size="1.5rem" />
                  </div>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h2 class="card-title text-xl mb-1">{{ category.name }}</h2>
                <p class="text-sm opacity-70">
                  by {{ category.owner?.name || "Unknown" }}
                </p>
              </div>
              <div class="badge badge-success badge-sm">
                <Icon name="ic:round-public" size="0.875rem" />
                Public
              </div>
            </div>

            <div class="stats stats-horizontal bg-base-200 shadow-sm">
              <div class="stat p-3">
                <div class="stat-title text-xs opacity-70">Items</div>
                <div class="stat-value text-2xl text-primary">
                  {{ category.itemCount }}
                </div>
              </div>
              <div class="stat p-3">
                <div class="stat-title text-xs opacity-70">Songs</div>
                <div class="stat-value text-2xl text-secondary">
                  {{ category.songCount }}
                </div>
              </div>
            </div>

            <div
              v-if="category.createdAt"
              class="text-xs opacity-50 mt-2 flex items-center gap-1"
            >
              <Icon name="ic:round-access-time" size="0.875rem" />
              Created {{ formatDate(category.createdAt) }}
            </div>

            <div class="card-actions justify-end mt-4">
              <button
                class="btn btn-primary btn-sm rounded-full"
                @click.stop="viewCategory(category)"
              >
                <Icon name="ic:round-visibility" size="1rem" />
                View
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex items-center justify-center min-h-100">
        <div class="text-center">
          <Icon
            name="ic:round-public"
            size="4rem"
            class="opacity-30 mx-auto mb-4"
          />
          <h3 class="text-2xl font-bold mb-2">No Public Categories Found</h3>
          <p class="opacity-70 mb-4">
            {{
              searchQuery
                ? "Try a different search term"
                : "Be the first to share a category!"
            }}
          </p>
          <NuxtLink to="/" class="btn btn-primary">
            <Icon name="ic:round-home" size="1.2rem" />
            Go Home
          </NuxtLink>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.total > pagination.limit"
        class="flex justify-center mt-8"
      >
        <div class="join">
          <button
            class="join-item btn"
            :disabled="pagination.page === 1"
            @click="changePage(pagination.page - 1)"
          >
            «
          </button>
          <button class="join-item btn">Page {{ pagination.page }}</button>
          <button
            class="join-item btn"
            :disabled="pagination.page * pagination.limit >= pagination.total"
            @click="changePage(pagination.page + 1)"
          >
            »
          </button>
        </div>
      </div>
    </div>

    <!-- View Category Modal -->
    <dialog v-if="selectedCategory" class="modal modal-open">
      <div class="modal-box max-w-4xl">
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          @click="closeModal"
        >
          ✕
        </button>

        <div class="flex items-start gap-3 mb-6">
          <div class="avatar">
            <div class="w-16 h-16 rounded-full">
              <img
                v-if="selectedCategory.owner?.avatar"
                :src="selectedCategory.owner.avatar"
                :alt="selectedCategory.owner.name"
              />
              <div
                v-else
                class="bg-base-300 w-full h-full flex items-center justify-center"
              >
                <Icon name="ic:round-person" size="2rem" />
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-3xl font-bold mb-1">{{ selectedCategory.name }}</h3>
            <p class="text-lg opacity-70">
              by {{ selectedCategory.owner?.name || "Unknown" }}
            </p>
          </div>
        </div>

        <div class="divider"></div>

        <div v-if="loadingDetails" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div
          v-else-if="categoryDetails"
          class="space-y-4 max-h-[60vh] overflow-y-auto"
        >
          <div
            v-for="item in categoryDetails.items"
            :key="item.id"
            class="card bg-base-200 shadow-sm rounded-2xl"
          >
            <div class="card-body p-4">
              <h4 class="card-title text-xl mb-3">{{ item.name }}</h4>
              <SongList :songs="item.songs" :item-name="item.name" />
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 opacity-50">
          Failed to load category details
        </div>
      </div>
      <div class="modal-backdrop" @click="closeModal"></div>
    </dialog>
  </div>
</template>

<script setup>
const searchQuery = ref("");
const publicCategories = ref([]);
const loading = ref(true);
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
});

const selectedCategory = ref(null);
const categoryDetails = ref(null);
const loadingDetails = ref(false);

let searchTimeout = null;

async function fetchPublicCategories() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (searchQuery.value) {
      params.append("search", searchQuery.value);
    }

    const data = await $fetch(`/api/categories/public?${params}`);
    publicCategories.value = data.categories;
    pagination.value = data.pagination;
  } catch (error) {
    console.error("Error fetching public categories:", error);
    publicCategories.value = [];
  } finally {
    loading.value = false;
  }
}

function debouncedSearch() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    fetchPublicCategories();
  }, 500);
}

function changePage(page) {
  pagination.value.page = page;
  fetchPublicCategories();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function viewCategory(category) {
  selectedCategory.value = category;
  loadingDetails.value = true;
  categoryDetails.value = null;

  try {
    // Fetch full category details with items and songs
    const data = await $fetch(`/api/categories/${category.id}/public`);
    categoryDetails.value = data;
  } catch (error) {
    console.error("Error fetching category details:", error);
  } finally {
    loadingDetails.value = false;
  }
}

function closeModal() {
  selectedCategory.value = null;
  categoryDetails.value = null;
}

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Load categories on mount
onMounted(() => {
  fetchPublicCategories();
});
</script>

<style scoped>
.card {
  transition: all 0.3s ease;
}
</style>
