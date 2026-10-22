<template>
  <UiPageContainer
    title="Browse"
    description="Public categories shared by the community"
    width="wide"
    class="space-y-4"
  >
    <label class="input w-full">
      <Icon name="mdi:magnify" class="opacity-60" />
      <input
        v-model="search"
        type="search"
        placeholder="Search public categories…"
      />
      <span v-if="pending" class="loading loading-spinner loading-xs" />
    </label>

    <div v-if="pending && !response" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>
    <div v-else-if="listError" class="text-center py-16">
      <Icon
        name="mdi:alert-circle-outline"
        size="3rem"
        class="text-error opacity-60 mx-auto mb-3"
      />
      <p class="mb-4">{{ listError }}</p>
      <button class="btn btn-primary btn-sm" @click="refresh()">Retry</button>
    </div>
    <DiscoveryCategoryGrid
      v-else-if="response?.data.length"
      :categories="response.data"
      @select="open"
    />
    <div v-else class="text-center py-20">
      <Icon name="mdi:earth" size="3rem" class="opacity-30 mx-auto mb-2" />
      <p class="opacity-60">
        {{ routeSearch ? "No matches" : "Nothing shared yet" }}
      </p>
    </div>

    <div v-if="totalPages > 1" class="flex justify-center">
      <div class="join">
        <button
          class="join-item btn btn-sm"
          :disabled="page === 1"
          @click="changePage(page - 1)"
        >
          «
        </button>
        <button class="join-item btn btn-sm btn-ghost">
          {{ page }} / {{ totalPages }}
        </button>
        <button
          class="join-item btn btn-sm"
          :disabled="page >= totalPages"
          @click="changePage(page + 1)"
        >
          »
        </button>
      </div>
    </div>

    <DiscoveryCategoryDialog
      :summary="selected"
      :detail="detail"
      :loading="loadingDetail"
      :load-error="detailError"
      :logged-in="loggedIn"
      :importing="importing"
      :mutation-error="importError"
      :message="importMessage"
      @close="close"
      @retry="loadDetail"
      @import="importSelected"
    />
  </UiPageContainer>
</template>

<script setup lang="ts">
useSeoMeta({
  title: "Browse · Songascribe",
  description: "Browse public Songascribe categories.",
});

const route = useRoute();
const router = useRouter();
const { loggedIn } = useUserSession();
const { addImportedCategory } = useCategories();
const routeSearch = computed(() =>
  typeof route.query.q === "string" ? route.query.q : "",
);
const page = computed(() => {
  const value = Number(route.query.page ?? 1);
  return Number.isInteger(value) && value > 0 ? value : 1;
});
const search = ref(routeSearch.value);
let searchTimer: ReturnType<typeof setTimeout> | null = null;

const {
  data: response,
  pending,
  error,
  refresh,
} = await useFetch<Paginated<PublicCategorySummary>>("/api/public/categories", {
  query: {
    search: computed(() => routeSearch.value || undefined),
    page,
    limit: 20,
  },
});
const listError = computed(() =>
  error.value
    ? getApiErrorMessage(error.value, "Failed to load public categories")
    : "",
);
const totalPages = computed(() => response.value?.pagination.pages ?? 1);

watch(routeSearch, (value) => {
  if (search.value !== value) search.value = value;
});
watch(search, (value) => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    router.replace({
      query: { ...route.query, q: value.trim() || undefined, page: undefined },
    });
  }, 400);
});
onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

function changePage(nextPage: number) {
  router.push({
    query: {
      ...route.query,
      page: nextPage > 1 ? String(nextPage) : undefined,
    },
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const selected = ref<PublicCategorySummary | null>(null);
const detail = ref<PublicCategory | null>(null);
const loadingDetail = ref(false);
const detailError = ref("");
const importing = ref(false);
const importError = ref("");
const importMessage = ref("");

function open(category: PublicCategorySummary) {
  selected.value = category;
  importError.value = "";
  importMessage.value = "";
  loadDetail();
}
async function loadDetail() {
  if (!selected.value) return;
  loadingDetail.value = true;
  detailError.value = "";
  try {
    detail.value = await $fetch<PublicCategory>(
      `/api/public/categories/${selected.value.id}`,
    );
  } catch (cause) {
    detail.value = null;
    detailError.value = getApiErrorMessage(cause, "Failed to load category");
  } finally {
    loadingDetail.value = false;
  }
}
function close() {
  selected.value = null;
  detail.value = null;
  detailError.value = "";
}
async function importSelected() {
  if (!selected.value || !loggedIn.value) return;
  importing.value = true;
  importError.value = "";
  importMessage.value = "";
  try {
    const imported = await $fetch<Category>(
      `/api/public/categories/${selected.value.id}/import`,
      { method: "POST" },
    );
    addImportedCategory(imported);
    importMessage.value = `Imported “${imported.name}” into your library`;
  } catch (cause) {
    importError.value = getApiErrorMessage(cause, "Failed to import category");
  } finally {
    importing.value = false;
  }
}
</script>
