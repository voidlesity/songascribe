<template>
  <div class="min-h-screen bg-base-200">
    <div class="container mx-auto p-4 max-w-7xl">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-4xl font-bold mb-2">Statistics</h1>
        <p class="text-lg opacity-70">
          Your Songascribe analytics and insights
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center min-h-100">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Stats Content -->
      <div v-else-if="stats" class="space-y-6">
        <!-- Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="stat bg-base-100 rounded-box shadow-xl p-6">
            <div class="stat-figure text-primary">
              <Icon name="ic:round-category" size="2rem" />
            </div>
            <div class="stat-value">{{ stats.overview.totalCategories }}</div>
            <div class="stat-title">Categories</div>
          </div>

          <div class="stat bg-base-100 rounded-box shadow-xl p-6">
            <div class="stat-figure text-secondary">
              <Icon name="ic:round-library-music" size="2rem" />
            </div>
            <div class="stat-value">{{ stats.overview.totalItems }}</div>
            <div class="stat-title">Items</div>
          </div>

          <div class="stat bg-base-100 rounded-box shadow-xl p-6">
            <div class="stat-figure text-accent">
              <Icon name="ic:round-music-note" size="2rem" />
            </div>
            <div class="stat-value">{{ stats.overview.totalTracks }}</div>
            <div class="stat-title">Unique Tracks</div>
          </div>

          <div class="stat bg-base-100 rounded-box shadow-xl p-6">
            <div class="stat-figure text-info">
              <Icon name="ic:round-access-time" size="2rem" />
            </div>
            <div class="stat-value">
              {{ stats.overview.totalDurationHours }}h
            </div>
            <div class="stat-title">Total Duration</div>
          </div>
        </div>

        <!-- Additional Overview Stats -->
        <div class="card bg-base-100 shadow-xl rounded-3xl">
          <div class="card-body">
            <h2 class="card-title text-2xl mb-4">
              <Icon name="ic:round-analytics" size="1.5rem" />
              Overview
            </h2>
            <div class="stats stats-vertical lg:stats-horizontal shadow w-full">
              <div class="stat">
                <div class="stat-value text-primary">
                  {{ stats.overview.avgTracksPerItem }}
                </div>
                <div class="stat-desc">Average tracks per item</div>
              </div>
              <div class="stat">
                <div class="stat-value text-secondary">
                  {{ stats.overview.totalTrackLinks }}
                </div>
                <div class="stat-desc">Total track assignments</div>
              </div>
              <div class="stat">
                <div class="stat-value text-accent">
                  {{ stats.overview.totalDurationMinutes }}m
                </div>
                <div class="stat-desc">Total duration (minutes)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Most Used Tracks -->
        <div class="card bg-base-100 shadow-xl rounded-3xl">
          <div class="card-body">
            <h2 class="card-title text-2xl mb-4">
              <Icon name="ic:round-trending-up" size="1.5rem" />
              Most Used Tracks
            </h2>
            <div v-if="stats.mostUsedTracks.length > 0" class="space-y-3">
              <div
                v-for="(song, index) in stats.mostUsedTracks"
                :key="song.encoded || index"
                class="flex items-center gap-4 p-4 bg-base-200 rounded-box hover:bg-base-300 transition-all"
              >
                <div class="avatar avatar-placeholder">
                  <div
                    class="bg-primary text-primary-content rounded-full w-10"
                  >
                    <span class="text-xl font-bold">{{ index + 1 }}</span>
                  </div>
                </div>
                <div class="avatar">
                  <div class="w-16 rounded-xl">
                    <img
                      v-if="song.artworkUrl"
                      :src="song.artworkUrl"
                      :alt="song.title"
                    />
                    <div
                      v-else
                      class="bg-base-300 w-full h-full flex items-center justify-center"
                    >
                      <Icon name="ic:round-library-music" size="1.5rem" />
                    </div>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate">
                    {{ song.title }}
                  </div>
                  <div class="text-sm opacity-70 truncate">
                    {{ song.author }}
                  </div>
                </div>
                <div class="badge badge-primary badge-lg">
                  {{ song.usageCount }}
                  {{ song.usageCount === 1 ? "use" : "uses" }}
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 opacity-50">
              No tracks added yet
            </div>
          </div>
        </div>

        <!-- Category Statistics -->
        <div class="card bg-base-100 shadow-xl rounded-3xl">
          <div class="card-body">
            <h2 class="card-title text-2xl mb-4">
              <Icon name="ic:round-category" size="1.5rem" />
              Categories Breakdown
            </h2>
            <div v-if="stats.categoryStats.length > 0" class="space-y-3">
              <div
                v-for="category in stats.categoryStats"
                :key="category.id"
                class="flex items-center gap-4 p-4 bg-base-200 rounded-box"
              >
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="font-semibold text-lg">{{ category.name }}</div>
                    <div
                      v-if="category.isPublic"
                      class="badge badge-success badge-sm"
                    >
                      <Icon name="ic:round-public" size="0.875rem" />
                      Public
                    </div>
                  </div>
                  <div class="flex gap-4 text-sm">
                    <div class="flex items-center gap-1">
                      <Icon
                        name="ic:round-library-music"
                        size="1rem"
                        class="opacity-70"
                      />
                      <span>{{ category.itemCount }} items</span>
                    </div>
                    <div class="flex items-center gap-1">
                      <Icon
                        name="ic:round-music-note"
                        size="1rem"
                        class="opacity-70"
                      />
                      <span>{{ category.trackCount }} tracks</span>
                    </div>
                  </div>
                </div>
                <div
                  class="radial-progress text-primary"
                  :style="`--value:${stats.overview.totalTracks ? ((category.trackCount / stats.overview.totalTracks) * 100).toFixed(0) : 0}; --size:4rem;`"
                >
                  {{
                    stats.overview.totalTracks
                      ? (
                          (category.trackCount / stats.overview.totalTracks) *
                          100
                        ).toFixed(0)
                      : 0
                  }}%
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 opacity-50">
              No categories created yet
            </div>
          </div>
        </div>

        <!-- Top Artists -->
        <div class="card bg-base-100 shadow-xl rounded-3xl">
          <div class="card-body">
            <h2 class="card-title text-2xl mb-4">
              <Icon name="ic:round-person" size="1.5rem" />
              Top Artists
            </h2>
            <div
              v-if="stats.topArtists.length > 0"
              class="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <div
                v-for="(artist, index) in stats.topArtists"
                :key="index"
                class="flex items-center gap-3 p-3 bg-base-200 rounded-box"
              >
                <div class="avatar avatar-placeholder">
                  <div
                    class="bg-linear-to-br from-primary to-secondary text-primary-content rounded-full w-8"
                  >
                    <span class="text-l font-bold">{{ index + 1 }}</span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate">{{ artist.name }}</div>
                  <div class="text-xs opacity-70">
                    {{ artist.trackCount }}
                    {{ artist.trackCount === 1 ? "track" : "tracks" }}
                  </div>
                </div>
                <progress
                  class="progress progress-primary w-16"
                  :value="artist.trackCount"
                  :max="stats.topArtists[0].trackCount"
                ></progress>
              </div>
            </div>
            <div v-else class="text-center py-8 opacity-50">
              No artists data available
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card bg-base-100 shadow-xl rounded-3xl">
          <div class="card-body">
            <h2 class="card-title text-2xl mb-4">
              <Icon name="ic:round-history" size="1.5rem" />
              Recent Activity
            </h2>
            <div v-if="stats.recentItems.length > 0" class="space-y-2">
              <div
                v-for="item in stats.recentItems"
                :key="item.id"
                class="flex items-center gap-3 p-3 bg-base-200 rounded-box hover:bg-base-300 transition-all"
              >
                <Icon
                  name="ic:round-library-music"
                  size="1.5rem"
                  class="opacity-50"
                />
                <div class="flex-1 min-w-0">
                  <div class="font-semibold truncate">{{ item.name }}</div>
                  <div class="text-sm opacity-70">
                    in {{ item.categoryName }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 opacity-50">
              No recent activity
            </div>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else class="flex items-center justify-center min-h-100">
        <div class="text-center">
          <Icon
            name="ic:round-error"
            size="4rem"
            class="opacity-30 mx-auto mb-4"
          />
          <h3 class="text-2xl font-bold mb-2">Failed to load statistics</h3>
          <p class="opacity-70 mb-4">Please try again later</p>
          <button class="btn btn-primary" @click="fetchStats">Retry</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: ["logged-in"],
});

const stats = ref(null);
const loading = ref(true);

async function fetchStats() {
  loading.value = true;
  try {
    const data = await $fetch("/api/statistics");
    stats.value = data;
  } catch (error) {
    console.error("Error fetching statistics:", error);
  } finally {
    loading.value = false;
  }
}

// Load stats on mount
onMounted(() => {
  fetchStats();
});
</script>
