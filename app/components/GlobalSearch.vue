<template>
  <div class="relative flex justify-center w-full">
    <!-- Desktop: inline search input -->
    <label class="input input-sm w-full hidden md:flex">
      <Icon name="mdi:magnify" class="opacity-60" />
      <input
        ref="desktopInput"
        v-model="query"
        type="search"
        placeholder="Search or paste URL…"
        @focus="open = true"
        @keydown.escape="close"
      />
      <kbd v-if="!query" class="kbd kbd-xs opacity-40">/</kbd>
      <span
        v-if="loading"
        class="loading loading-spinner loading-xs opacity-60"
      />
    </label>

    <!-- Mobile: search icon toggle -->
    <button
      class="btn btn-ghost btn-sm btn-square md:hidden"
      @click="toggleMobile"
    >
      <Icon name="mdi:magnify" size="1.25rem" />
    </button>

    <!-- Mobile: full-width search overlay -->
    <Transition name="search-slide">
      <div
        v-if="mobileOpen"
        class="fixed inset-x-0 top-0 z-50 bg-base-100 border-b border-base-300 p-3 flex items-center gap-2 md:hidden"
      >
        <label class="input input-sm flex-1">
          <Icon name="mdi:magnify" class="opacity-60" />
          <input
            ref="mobileInput"
            v-model="query"
            type="search"
            placeholder="Search or paste URL…"
            @keydown.escape="closeMobile"
          />
          <span
            v-if="loading"
            class="loading loading-spinner loading-xs opacity-60"
          />
        </label>
        <button class="btn btn-ghost btn-sm btn-square" @click="closeMobile">
          <Icon name="mdi:close" />
        </button>
      </div>
    </Transition>

    <!-- Results dropdown -->
    <div
      v-if="showResults"
      class="fixed inset-x-0 top-14 md:absolute md:top-full md:inset-x-0 md:mt-2 z-50 bg-base-100 border border-base-300 md:rounded-box shadow-xl max-h-80 overflow-y-auto"
    >
      <ul v-if="results.length" class="menu menu-sm w-full p-1">
        <li v-for="track in results" :key="track.encoded">
          <button
            type="button"
            class="flex items-center gap-2 w-full"
            title="Add to an item"
            @click="pick(track)"
          >
            <TrackArt :track="track" size="sm" />
            <div class="min-w-0 flex-1 text-left">
              <div class="text-sm font-medium truncate">{{ track.title }}</div>
              <div class="text-xs opacity-60 truncate">{{ track.author }}</div>
            </div>
            <Icon
              name="mdi:plus-box-multiple-outline"
              class="text-primary shrink-0"
            />
          </button>
        </li>
      </ul>
      <p
        v-else-if="query && !loading"
        class="text-center text-sm opacity-60 p-4"
      >
        No results
      </p>
    </div>

    <!-- Backdrop to close results -->
    <div v-if="showResults" class="fixed inset-0 z-40" @click="close" />

    <!-- Add-to-item picker -->
    <AddToItemDialog
      :track="selectedTrack"
      @close="selectedTrack = null"
      @added="selectedTrack = null"
    />
  </div>
</template>

<script setup lang="ts">
import type { Track } from "~/composables/useTrackSearch";

const query = ref("");
const { results, loading, clear: clearSearch } = useTrackSearch(query);

const open = ref(false);
const mobileOpen = ref(false);
const desktopInput = ref<HTMLInputElement | null>(null);
const mobileInput = ref<HTMLInputElement | null>(null);
const selectedTrack = ref<Track | null>(null);

const showResults = computed(
  () =>
    (open.value || mobileOpen.value) &&
    (results.value.length > 0 || (query.value.trim() !== "" && !loading.value)),
);

function pick(track: Track) {
  selectedTrack.value = track;
  close();
}

function close() {
  open.value = false;
  mobileOpen.value = false;
  query.value = "";
  clearSearch();
}

function toggleMobile() {
  mobileOpen.value = !mobileOpen.value;
  if (mobileOpen.value) {
    nextTick(() => mobileInput.value?.focus());
  }
}

function closeMobile() {
  mobileOpen.value = false;
  query.value = "";
  clearSearch();
}

// Global "/" keyboard shortcut to focus search
function onKeydown(e: KeyboardEvent) {
  if (
    e.key === "/" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(
      (e.target as HTMLElement)?.tagName,
    )
  ) {
    e.preventDefault();
    desktopInput.value?.focus();
    open.value = true;
  }
}

onMounted(() => {
  document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.search-slide-enter-active,
.search-slide-leave-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}
.search-slide-enter-from,
.search-slide-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
