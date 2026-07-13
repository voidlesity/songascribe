import type { TrackInput } from "#shared/contracts";
import { apiFetch, type ApiFetcher } from "./api";

export const mediaApi = {
  search(query: string, fetcher: ApiFetcher = $fetch) {
    return apiFetch<TrackInput[]>(fetcher, "/api/audio/search", { query: { q: query } });
  },
};
