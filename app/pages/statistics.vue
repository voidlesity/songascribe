<template>
  <div class="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
    <h1 class="text-2xl font-semibold">Statistics</h1>

    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="stats" class="space-y-4">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="card card-border bg-base-100">
          <div class="card-body p-4 flex-row items-center gap-3">
            <Icon name="mdi:folder-multiple" size="2rem" class="text-primary" />
            <div>
              <div class="text-2xl font-semibold">
                {{ stats.overview.totalCategories }}
              </div>
              <div class="text-xs opacity-60">Categories</div>
            </div>
          </div>
        </div>
        <div class="card card-border bg-base-100">
          <div class="card-body p-4 flex-row items-center gap-3">
            <Icon name="mdi:library-music" size="2rem" class="text-secondary" />
            <div>
              <div class="text-2xl font-semibold">
                {{ stats.overview.totalItems }}
              </div>
              <div class="text-xs opacity-60">Items</div>
            </div>
          </div>
        </div>
        <div class="card card-border bg-base-100">
          <div class="card-body p-4 flex-row items-center gap-3">
            <Icon name="mdi:music-note" size="2rem" class="text-accent" />
            <div>
              <div class="text-2xl font-semibold">
                {{ stats.overview.totalTracks }}
              </div>
              <div class="text-xs opacity-60">Tracks</div>
            </div>
          </div>
        </div>
        <div class="card card-border bg-base-100">
          <div class="card-body p-4 flex-row items-center gap-3">
            <Icon name="mdi:clock-outline" size="2rem" class="text-info" />
            <div>
              <div class="text-2xl font-semibold">
                {{ stats.overview.totalDurationHours }}h
              </div>
              <div class="text-xs opacity-60">Total</div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <section class="card card-border bg-base-100">
          <div class="card-body p-4">
            <h2 class="font-semibold mb-2 flex items-center gap-2">
              <Icon name="mdi:trending-up" /> Most Used Tracks
            </h2>
            <ul v-if="stats.mostUsedTracks.length" class="list">
              <li
                v-for="(track, i) in stats.mostUsedTracks"
                :key="track.encoded ?? i"
                class="list-row"
              >
                <span class="text-sm opacity-50 w-5 text-center">{{
                  i + 1
                }}</span>
                <TrackArt
                  :artwork-url="track.artworkUrl"
                  :title="track.title"
                  size="sm"
                />
                <div class="list-col-grow min-w-0">
                  <div class="font-medium truncate">{{ track.title }}</div>
                  <div class="text-xs opacity-60 truncate">
                    {{ track.author }}
                  </div>
                </div>
                <span class="badge badge-primary">{{ track.usageCount }}</span>
              </li>
            </ul>
            <p v-else class="opacity-60 text-sm py-4 text-center">
              No tracks yet
            </p>
          </div>
        </section>

        <section class="card card-border bg-base-100">
          <div class="card-body p-4">
            <h2 class="font-semibold mb-2 flex items-center gap-2">
              <Icon name="mdi:account-music" /> Top Artists
            </h2>
            <ul v-if="stats.topArtists.length" class="list">
              <li v-for="(a, i) in stats.topArtists" :key="i" class="list-row">
                <span class="text-sm opacity-50 w-5 text-center">{{
                  i + 1
                }}</span>
                <div class="list-col-grow min-w-0">
                  <div class="font-medium truncate">{{ a.name }}</div>
                  <progress
                    class="progress progress-primary h-1"
                    :value="a.trackCount"
                    :max="stats.topArtists[0]!.trackCount"
                  />
                </div>
                <span class="text-sm opacity-70">{{ a.trackCount }}</span>
              </li>
            </ul>
            <p v-else class="opacity-60 text-sm py-4 text-center">
              No artists yet
            </p>
          </div>
        </section>

        <section class="card card-border bg-base-100">
          <div class="card-body p-4">
            <h2 class="font-semibold mb-2 flex items-center gap-2">
              <Icon name="mdi:folder-multiple-outline" /> Categories
            </h2>
            <ul v-if="stats.categoryStats.length" class="list">
              <li v-for="c in stats.categoryStats" :key="c.id" class="list-row">
                <Icon
                  :name="c.isPublic ? 'mdi:earth' : 'mdi:folder'"
                  class="opacity-70"
                />
                <div class="list-col-grow min-w-0">
                  <div class="font-medium truncate">{{ c.name }}</div>
                  <div class="text-xs opacity-60">
                    {{ c.itemCount }} items · {{ c.trackCount }} tracks
                  </div>
                </div>
                <span
                  v-if="stats.overview.totalTracks"
                  class="text-xs opacity-60"
                >
                  {{
                    ((c.trackCount / stats.overview.totalTracks) * 100).toFixed(
                      0,
                    )
                  }}%
                </span>
              </li>
            </ul>
            <p v-else class="opacity-60 text-sm py-4 text-center">
              No categories yet
            </p>
          </div>
        </section>

        <section class="card card-border bg-base-100">
          <div class="card-body p-4">
            <h2 class="font-semibold mb-2 flex items-center gap-2">
              <Icon name="mdi:history" /> Recent Items
            </h2>
            <ul v-if="stats.recentItems.length" class="list">
              <li
                v-for="item in stats.recentItems"
                :key="item.id"
                class="list-row"
              >
                <Icon name="mdi:library-music" class="opacity-70" />
                <div class="list-col-grow min-w-0">
                  <div class="font-medium truncate">{{ item.name }}</div>
                  <div class="text-xs opacity-60 truncate">
                    in {{ item.categoryName }}
                  </div>
                </div>
              </li>
            </ul>
            <p v-else class="opacity-60 text-sm py-4 text-center">
              No activity yet
            </p>
          </div>
        </section>
      </div>
    </div>

    <div v-else class="text-center py-16 opacity-60">
      Failed to load statistics.
      <button class="btn btn-sm ml-2" @click="load">Retry</button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["logged-in"] });

interface Stats {
  overview: {
    totalCategories: number;
    totalItems: number;
    totalTracks: number;
    totalTrackLinks: number;
    totalDurationHours: number;
    totalDurationMinutes: number;
    avgTracksPerItem: number;
  };
  mostUsedTracks: {
    encoded?: string;
    title: string;
    author: string;
    artworkUrl?: string;
    usageCount: number;
  }[];
  categoryStats: {
    id: number;
    name: string;
    isPublic: boolean;
    itemCount: number;
    trackCount: number;
  }[];
  topArtists: { name: string; trackCount: number }[];
  recentItems: { id: number; name: string; categoryName: string }[];
}

const stats = ref<Stats | null>(null);
const loading = ref(true);

async function load() {
  loading.value = true;
  try {
    stats.value = await $fetch<Stats>("/api/statistics");
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
