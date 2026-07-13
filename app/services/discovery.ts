import type { Category, Paginated, PublicCategorySummary } from "#shared/contracts";
import { apiFetch, type ApiFetcher } from "./api";

export type PublicCategoryDetail = Pick<Category, "id" | "name" | "description" | "createdAt" | "items">;

export const discoveryApi = {
  list(options: { search?: string; page?: number; limit?: number } = {}, fetcher: ApiFetcher = $fetch) {
    return apiFetch<Paginated<PublicCategorySummary>>(fetcher, "/api/public/categories", {
      query: { search: options.search || undefined, page: options.page ?? 1, limit: options.limit ?? 20 },
    });
  },
  detail(id: number, fetcher: ApiFetcher = $fetch) {
    return apiFetch<PublicCategoryDetail>(fetcher, `/api/public/categories/${id}`);
  },
  importCategory(id: number, fetcher: ApiFetcher = $fetch) {
    return apiFetch<Category>(fetcher, `/api/public/categories/${id}/import`, { method: "POST" });
  },
};
