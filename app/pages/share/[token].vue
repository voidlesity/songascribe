<template>
  <UiPageContainer width="default">
    <div v-if="pending" class="flex justify-center py-20"><span class="loading loading-spinner loading-lg" /></div>
    <div v-else-if="error || !category" class="text-center py-20">
      <Icon name="mdi:link-variant-off" size="3rem" class="opacity-30 mx-auto mb-2" />
      <h1 class="text-xl font-semibold mb-1">{{ errorMessage }}</h1>
      <p class="opacity-60 mb-4">The share link may be invalid or expired.</p>
      <NuxtLink :to="loggedIn ? '/' : '/intro'" class="btn btn-primary btn-sm">Home</NuxtLink>
    </div>

    <div v-else class="space-y-4">
      <header class="card card-border bg-base-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
        <div>
          <div class="flex items-center gap-2 text-xs opacity-60 mb-1"><Icon name="mdi:share-variant" /> Shared category</div>
          <h1 class="text-2xl font-semibold">{{ category.name }}</h1>
          <p v-if="category.description" class="text-sm opacity-80 whitespace-pre-line mt-2">{{ category.description }}</p>
        </div>
        <NuxtLink :to="loggedIn ? '/' : '/intro'" class="btn btn-ghost btn-sm"><Icon name="mdi:home" /> Home</NuxtLink>
      </header>

      <div v-if="category.items.length" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <article v-for="item in category.items" :key="item.id" class="card card-border bg-base-100">
          <div class="card-body p-4">
            <h2 class="font-semibold">{{ item.name }}</h2>
            <p v-if="item.description" class="text-xs opacity-70 whitespace-pre-line">{{ item.description }}</p>
            <TracksSongList
              :songs="item.tracks"
              :item-name="item.name"
              :item-id="item.id"
              :category-name="category.name"
              :category-id="category.id"
            />
          </div>
        </article>
      </div>
      <div v-else class="text-center py-16 opacity-60">No items in this category yet</div>
    </div>
  </UiPageContainer>
</template>

<script setup lang="ts">
import { getApiErrorMessage } from "~/services/api";
import { sharingApi } from "~/services/sharing";

const route = useRoute();
const { loggedIn } = useUserSession();
const token = computed(() => String(route.params.token ?? ""));
const requestFetch = useRequestFetch();
const { data: category, pending, error } = await useAsyncData(
  "shared-category",
  () => sharingApi.get(token.value, requestFetch),
  { watch: [token] },
);
const errorMessage = computed(() => {
  const status = (error.value as { statusCode?: number } | null)?.statusCode;
  return status === 404
    ? "Share not found"
    : getApiErrorMessage(error.value, "Failed to load shared category");
});
useSeoMeta({ title: () => category.value ? `${category.value.name} · Songascribe` : "Shared category · Songascribe" });
</script>
