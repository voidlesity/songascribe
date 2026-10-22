export function useTrackSearch(query: Ref<string>, debounceMs = 400) {
  const results = ref<Track[]>([]);
  const loading = ref(false);
  const error = ref("");
  let handle: ReturnType<typeof setTimeout> | null = null;
  let requestId = 0;

  async function run() {
    const q = query.value.trim();
    const currentRequest = ++requestId;
    if (!q) {
      results.value = [];
      loading.value = false;
      error.value = "";
      return;
    }
    loading.value = true;
    error.value = "";
    try {
      const data = await $fetch<Track[]>("/api/audio/search", {
        query: { q },
      });
      if (currentRequest === requestId) results.value = data;
    } catch (cause) {
      if (currentRequest === requestId) {
        results.value = [];
        error.value = getApiErrorMessage(cause, "Search failed");
      }
    } finally {
      if (currentRequest === requestId) loading.value = false;
    }
  }

  const stop = watch(query, () => {
    if (handle) clearTimeout(handle);
    handle = setTimeout(run, debounceMs);
  });

  function clear() {
    if (handle) clearTimeout(handle);
    handle = null;
    requestId++;
    results.value = [];
    loading.value = false;
    error.value = "";
  }

  onScopeDispose(() => {
    stop();
    clear();
  });

  return { results, loading, error, clear };
}
