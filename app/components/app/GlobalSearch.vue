<template>
  <div class="relative flex justify-center w-full">
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

    <button
      type="button"
      class="btn btn-ghost btn-sm btn-square md:hidden"
      aria-label="Search"
      @click="toggleMobile"
    >
      <Icon name="mdi:magnify" size="1.25rem" />
    </button>

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
            @keydown.escape="close"
          />
          <span
            v-if="loading"
            class="loading loading-spinner loading-xs opacity-60"
          />
        </label>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-square"
          aria-label="Close search"
          @click="close"
        >
          <Icon name="mdi:close" />
        </button>
      </div>
    </Transition>

    <p
      v-if="error"
      class="absolute top-full mt-1 text-error text-xs bg-base-100 px-2 py-1 rounded-box shadow"
    >
      {{ error }}
    </p>

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

    <div v-if="showResults" class="fixed inset-0 z-40" @click="close" />

    <CatalogAddToItemDialog
      :track="selectedTrack"
      @close="selectedTrack = null"
    />
  </div>
</template>

<script setup lang="ts">
const query = ref("");
const { results, loading, error, clear: clearSearch } = useTrackSearch(query);

const open = ref(false);
const mobileOpen = ref(false);
const desktopInput = useTemplateRef("desktopInput");
const mobileInput = useTemplateRef("mobileInput");
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

/** Focuses the search when "/" is pressed outside of a form field. */
function onKeydown(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;
  if (
    event.key === "/" &&
    !["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
  ) {
    event.preventDefault();
    desktopInput.value?.focus();
    open.value = true;
  }
}

onMounted(() => document.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => document.removeEventListener("keydown", onKeydown));
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
