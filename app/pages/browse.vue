<template>
  <div class="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
    <header>
      <h1 class="text-2xl font-semibold">Browse</h1>
      <p class="text-sm opacity-60">
        Public categories shared by the community
      </p>
    </header>

    <label class="input w-full">
      <Icon name="mdi:magnify" class="opacity-60" />
      <input
        v-model="search"
        type="search"
        placeholder="Search public categories…"
        @input="onSearch"
      >
    </label>

    <div v-if="loading" class="flex justify-center py-16">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="list.length"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
    >
      <button
        v-for="c in list"
        :key="c.id"
        class="card card-border bg-base-100 text-left hover:border-primary transition cursor-pointer"
        @click="open(c)"
      >
        <div class="card-body p-4 gap-2">
          <div class="flex items-center gap-2">
            <div class="avatar">
              <div class="w-8 h-8 rounded-full bg-base-300">
                <img
                  v-if="c.owner?.avatar"
                  :src="c.owner.avatar"
                  :alt="c.owner.displayName"
                >
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                >
                  <Icon name="mdi:account" />
                </div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h2 class="font-semibold truncate">{{ c.name }}</h2>
              <p class="text-xs opacity-60 truncate">
                {{ c.owner?.displayName ?? "Unknown" }}
              </p>
            </div>
          </div>
          <div class="flex gap-3 text-xs opacity-70">
            <span><Icon name="mdi:library-music" /> {{ c.itemCount }}</span>
            <span><Icon name="mdi:music-note" /> {{ c.trackCount }}</span>
          </div>
        </div>
      </button>
    </div>

    <div v-else class="text-center py-20">
      <Icon name="mdi:earth" size="3rem" class="opacity-30 mx-auto mb-2" />
      <p class="opacity-60">
        {{ search ? "No matches" : "Nothing shared yet" }}
      </p>
    </div>

    <div v-if="totalPages > 1" class="flex justify-center">
      <div class="join">
        <button
          class="join-item btn btn-sm"
          :disabled="pagination.page === 1"
          @click="changePage(pagination.page - 1)"
        >
          «
        </button>
        <button class="join-item btn btn-sm btn-ghost">
          {{ pagination.page }} / {{ totalPages }}
        </button>
        <button
          class="join-item btn btn-sm"
          :disabled="pagination.page >= totalPages"
          @click="changePage(pagination.page + 1)"
        >
          »
        </button>
      </div>
    </div>

    <dialog :class="['modal', { 'modal-open': !!selected }]">
      <div class="modal-box max-w-3xl">
        <button
          class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          @click="close"
        >
          ✕
        </button>

        <div v-if="selected" class="flex items-center gap-3 mb-4">
          <div class="avatar">
            <div class="w-12 h-12 rounded-full bg-base-300">
              <img
                v-if="selected.owner?.avatar"
                :src="selected.owner.avatar"
                :alt="selected.owner.displayName"
              >
              <div
                v-else
                class="w-full h-full flex items-center justify-center"
              >
                <Icon name="mdi:account" size="1.5rem" />
              </div>
            </div>
          </div>
          <div>
            <h3 class="text-xl font-semibold">{{ selected.name }}</h3>
            <p class="text-sm opacity-60">
              by {{ selected.owner?.displayName ?? "Unknown" }}
            </p>
          </div>
        </div>

        <div v-if="loadingDetail" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-lg" />
        </div>

        <div v-else-if="detail" class="space-y-3 max-h-[60vh] overflow-y-auto">
          <article
            v-for="item in detail.items"
            :key="item.id"
            class="card card-border bg-base-200"
          >
            <div class="card-body p-3">
              <h4 class="font-semibold mb-2">{{ item.name }}</h4>
              <SongList :songs="item.tracks" :item-name="item.name" />
            </div>
          </article>
          <p v-if="!detail.items.length" class="text-center opacity-60 py-8">
            No items yet
          </p>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop" @submit.prevent="close">
        <button>close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import type { Track } from "~/composables/useTrackSearch";

interface Owner {
  displayName?: string;
  avatar?: string;
}

interface PublicCategoryListItem {
  id: number;
  name: string;
  itemCount: number;
  trackCount: number;
  createdAt?: string;
  owner?: Owner;
}

interface PublicCategoryDetail {
  id: number;
  name: string;
  owner?: Owner;
  items: { id: number; name: string; tracks: Track[] }[];
}

interface PageResponse {
  data: PublicCategoryListItem[];
  pagination: { page: number; limit: number; total: number };
}

const search = ref("");
const list = ref<PublicCategoryListItem[]>([]);
const loading = ref(true);
const pagination = ref({ page: 1, limit: 20, total: 0 });

const selected = ref<PublicCategoryListItem | null>(null);
const detail = ref<PublicCategoryDetail | null>(null);
const loadingDetail = ref(false);

let timer: ReturnType<typeof setTimeout> | null = null;

async function load() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(pagination.value.page),
      limit: String(pagination.value.limit),
    });
    if (search.value) params.append("search", search.value);

    const data = await $fetch<PageResponse>(`/api/public/categories?${params}`);
    list.value = data.data;
    pagination.value = data.pagination;
  } catch (err) {
    console.error(err);
    list.value = [];
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    pagination.value.page = 1;
    load();
  }, 400);
}

function changePage(p: number) {
  pagination.value.page = p;
  load();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function open(c: PublicCategoryListItem) {
  selected.value = c;
  loadingDetail.value = true;
  detail.value = null;
  try {
    detail.value = await $fetch<PublicCategoryDetail>(
      `/api/public/categories/${c.id}`,
    );
  } finally {
    loadingDetail.value = false;
  }
}

function close() {
  selected.value = null;
  detail.value = null;
}

const totalPages = computed(() =>
  Math.max(1, Math.ceil(pagination.value.total / pagination.value.limit)),
);

onMounted(load);
</script>
