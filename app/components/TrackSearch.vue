<template>
  <div class="relative">
    <label class="input w-full" :class="inputSize">
      <Icon name="mdi:magnify" class="opacity-60" />
      <input
        v-model="query"
        :autofocus="autofocus"
        type="search"
        :placeholder="placeholder"
        @focus="open = true"
      />
      <span
        v-if="loading"
        class="loading loading-spinner loading-xs opacity-60"
      />
    </label>

    <div
      v-if="open && (results.length || (query && !loading))"
      class="absolute z-30 mt-2 w-full bg-base-100 border border-base-300 rounded-box shadow-xl max-h-96 overflow-y-auto"
    >
      <ul v-if="results.length" class="list">
        <li
          v-for="track in results"
          :key="track.encoded"
          class="list-row p-2 hover:bg-base-200 cursor-pointer"
          @click="pick(track)"
        >
          <TrackArt :track="track" size="sm" />
          <div class="list-col-grow min-w-0">
            <div class="truncate text-sm font-medium">{{ track.title }}</div>
            <div class="truncate text-xs opacity-60">{{ track.author }}</div>
          </div>
          <Icon name="mdi:plus" class="text-primary" />
        </li>
      </ul>
      <p v-else class="text-center text-sm opacity-60 p-4">No results</p>
    </div>

    <div v-if="open" class="fixed inset-0 z-20" @click="close" />
  </div>
</template>

<script setup lang="ts">
import type { Track } from "~/composables/useTrackSearch";

const props = withDefaults(
  defineProps<{
    placeholder?: string;
    size?: "sm" | "md" | "lg";
    autofocus?: boolean;
  }>(),
  { placeholder: "Search songs or paste a URL…", size: "md", autofocus: false },
);

const emit = defineEmits<{
  select: [track: Track];
}>();

const query = ref("");
const { results, loading, clear } = useTrackSearch(query);
const open = ref(false);

const inputSize = computed(() =>
  props.size === "lg" ? "input-lg" : props.size === "sm" ? "input-sm" : "",
);

function pick(track: Track) {
  emit("select", track);
  query.value = "";
  clear();
  open.value = false;
}

function close() {
  open.value = false;
}

watch(results, (r) => {
  if (r.length) open.value = true;
});
</script>
