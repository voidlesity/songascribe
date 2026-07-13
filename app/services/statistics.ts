import type { Statistics } from "#shared/contracts";
import { apiFetch, type ApiFetcher } from "./api";

export const statisticsApi = {
  get(fetcher: ApiFetcher = $fetch) {
    return apiFetch<Statistics>(fetcher, "/api/statistics");
  },
};
