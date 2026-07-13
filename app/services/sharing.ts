import type { Category } from "#shared/contracts";
import { apiFetch, type ApiFetcher } from "./api";

export type SharedCategory = Pick<Category, "id" | "name" | "description" | "items">;

export const sharingApi = {
  get(token: string, fetcher: ApiFetcher = $fetch) {
    return apiFetch<SharedCategory>(fetcher, `/api/shares/${encodeURIComponent(token)}`);
  },
};
