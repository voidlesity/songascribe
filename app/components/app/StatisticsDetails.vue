<template>
  <div class="grid lg:grid-cols-2 gap-4">
    <section class="card card-border bg-base-100"><div class="card-body p-4">
      <h2 class="font-semibold mb-2 flex items-center gap-2"><Icon name="mdi:trending-up" /> Most Used Tracks</h2>
      <ul v-if="stats.mostUsedTracks.length" class="list">
        <li v-for="(track, index) in stats.mostUsedTracks" :key="track.id" class="list-row">
          <span class="text-sm opacity-50 w-5 text-center">{{ index + 1 }}</span>
          <TrackArt :artwork-url="track.artworkUrl" :title="track.title" size="sm" />
          <div class="list-col-grow min-w-0"><div class="font-medium truncate">{{ track.title }}</div><div class="text-xs opacity-60 truncate">{{ track.author }}</div></div>
          <span class="badge badge-primary">{{ track.usageCount }}</span>
        </li>
      </ul>
      <p v-else class="opacity-60 text-sm py-4 text-center">No tracks yet</p>
    </div></section>

    <section class="card card-border bg-base-100"><div class="card-body p-4">
      <h2 class="font-semibold mb-2 flex items-center gap-2"><Icon name="mdi:account-music" /> Top Artists</h2>
      <ul v-if="stats.topArtists.length" class="list">
        <li v-for="(artist, index) in stats.topArtists" :key="artist.name" class="list-row">
          <span class="text-sm opacity-50 w-5 text-center">{{ index + 1 }}</span>
          <div class="list-col-grow min-w-0"><div class="font-medium truncate">{{ artist.name }}</div><progress class="progress progress-primary h-1" :value="artist.trackCount" :max="stats.topArtists[0]?.trackCount ?? 1" /></div>
          <span class="text-sm opacity-70">{{ artist.trackCount }}</span>
        </li>
      </ul>
      <p v-else class="opacity-60 text-sm py-4 text-center">No artists yet</p>
    </div></section>

    <section class="card card-border bg-base-100"><div class="card-body p-4">
      <h2 class="font-semibold mb-2 flex items-center gap-2"><Icon name="mdi:folder-multiple-outline" /> Categories</h2>
      <ul v-if="stats.categoryStats.length" class="list">
        <li v-for="category in stats.categoryStats" :key="category.id" class="list-row">
          <Icon :name="category.isPublic ? 'mdi:earth' : 'mdi:folder'" class="opacity-70" />
          <div class="list-col-grow min-w-0"><div class="font-medium truncate">{{ category.name }}</div><div class="text-xs opacity-60">{{ category.itemCount }} items · {{ category.trackCount }} tracks</div></div>
          <span v-if="stats.overview.totalTracks" class="text-xs opacity-60">{{ ((category.trackCount / stats.overview.totalTracks) * 100).toFixed(0) }}%</span>
        </li>
      </ul>
      <p v-else class="opacity-60 text-sm py-4 text-center">No categories yet</p>
    </div></section>

    <section class="card card-border bg-base-100"><div class="card-body p-4">
      <h2 class="font-semibold mb-2 flex items-center gap-2"><Icon name="mdi:history" /> Recent Items</h2>
      <ul v-if="stats.recentItems.length" class="list">
        <li v-for="item in stats.recentItems" :key="item.id" class="list-row">
          <Icon name="mdi:library-music" class="opacity-70" />
          <div class="list-col-grow min-w-0"><div class="font-medium truncate">{{ item.name }}</div><div class="text-xs opacity-60 truncate">in {{ item.categoryName }}</div></div>
        </li>
      </ul>
      <p v-else class="opacity-60 text-sm py-4 text-center">No activity yet</p>
    </div></section>
  </div>
</template>

<script setup lang="ts">
import type { Statistics } from "#shared/contracts";
defineProps<{ stats: Statistics }>();
</script>
