<template>
  <UiPageContainer title="Statistics" width="wide">
    <div v-if="pending" class="flex justify-center py-16"><span class="loading loading-spinner loading-lg" /></div>
    <div v-else-if="error || !stats" class="text-center py-16">
      <Icon name="mdi:chart-box-outline" size="3rem" class="opacity-30 mx-auto mb-3" />
      <p class="mb-4">{{ errorMessage }}</p>
      <button class="btn btn-primary btn-sm" @click="retry">Retry</button>
    </div>
    <div v-else class="space-y-4">
      <AppStatisticsOverview :overview="stats.overview" />
      <AppStatisticsDetails :stats="stats" />
    </div>
  </UiPageContainer>
</template>

<script setup lang="ts">
import { getApiErrorMessage } from "~/services/api";
import { statisticsApi } from "~/services/statistics";

definePageMeta({ middleware: ["auth"] });
useSeoMeta({ title: "Statistics · Songascribe" });

const requestFetch = useRequestFetch();
const { data: stats, pending, error, refresh } = await useAsyncData(
  "library-statistics",
  () => statisticsApi.get(requestFetch),
);
function retry() {
  return refresh();
}
const errorMessage = computed(() =>
  getApiErrorMessage(error.value, "Failed to load statistics"),
);
</script>
