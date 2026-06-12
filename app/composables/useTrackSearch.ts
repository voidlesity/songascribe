import type { Ref } from "vue";

export interface Track {
  id?: number;
  encoded: string;
  identifier?: string;
  source?: string;
  title: string;
  author: string;
  lengthMs?: number;
  uri?: string | null;
  artworkUrl?: string | null;
  isrc?: string | null;
  isStream?: boolean;
  isSeekable?: boolean;
  reason?: string | null;
}

export function useTrackSearch(query: Ref<string>, debounceMs = 400) {
  const results = ref<Track[]>([]);
  const loading = ref(false);
  let handle: ReturnType<typeof setTimeout> | null = null;
  let lastQuery = "";

  async function run() {
    const q = query.value.trim();
    if (!q) {
      results.value = [];
      return;
    }
    lastQuery = q;
    loading.value = true;
    try {
      const data = await $fetch<Track[]>(
        `/api/audio/search?q=${encodeURIComponent(q)}`,
      );
      if (q === lastQuery) results.value = Array.isArray(data) ? data : [];
    } catch {
      if (q === lastQuery) results.value = [];
    } finally {
      if (q === lastQuery) loading.value = false;
    }
  }

  watch(query, () => {
    if (handle) clearTimeout(handle);
    handle = setTimeout(run, debounceMs);
  });

  function clear() {
    if (handle) clearTimeout(handle);
    results.value = [];
    loading.value = false;
    lastQuery = "";
  }

  return { results, loading, search: run, clear };
}
