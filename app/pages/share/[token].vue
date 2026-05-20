<template>
  <div class="min-h-screen bg-base-200">
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <div
      v-else-if="error"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <Icon
          name="ic:round-error"
          size="4rem"
          class="opacity-30 mx-auto mb-4"
        />
        <h3 class="text-2xl font-bold mb-2">{{ error }}</h3>
        <p class="opacity-70 mb-4">The share link may be invalid or expired.</p>
        <NuxtLink to="/" class="btn btn-primary">Go Home</NuxtLink>
      </div>
    </div>

    <div v-else-if="category" class="container mx-auto p-4 max-w-7xl">
      <!-- Header -->
      <div class="bg-base-100 rounded-3xl shadow-xl p-6 mb-6">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <Icon name="ic:round-share" size="1.5rem" class="opacity-50" />
              <span class="text-sm opacity-70">Shared Category</span>
            </div>
            <h1 class="text-3xl font-bold">{{ category.name }}</h1>
          </div>
          <NuxtLink to="/" class="btn btn-ghost">
            <Icon name="ic:round-home" size="1.2rem" />
            Home
          </NuxtLink>
        </div>
      </div>

      <!-- Items Grid -->
      <div
        v-if="category.items.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div
          v-for="item in category.items"
          :key="item.id"
          class="card bg-base-100 shadow-xl rounded-3xl hover:shadow-2xl transition-all"
        >
          <div class="card-body p-6">
            <h2 class="card-title text-2xl mb-4">{{ item.name }}</h2>

            <SongList :songs="item.tracks" :item-name="item.name" />
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20">
        <Icon
          name="ic:round-library-music"
          size="4rem"
          class="opacity-30 mx-auto mb-4"
        />
        <h3 class="text-2xl font-bold mb-2">No Items Yet</h3>
        <p class="opacity-70">This category doesn't have any items yet.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute();
const token = route.params.token;

const category = ref(null);
const loading = ref(true);
const error = ref(null);

async function fetchSharedCategory() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch(`/api/shares/${token}`);
    category.value = data;
  } catch (err) {
    console.error("Error fetching shared category:", err);
    error.value =
      err.statusCode === 404
        ? "Share not found"
        : "Failed to load shared category";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchSharedCategory();
});
</script>
