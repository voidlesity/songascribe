import type {
  Category,
  CreateCategoryBody,
  CreateItemBody,
  Item,
  ReorderCategoryItemsBody,
  ReorderItemTracksBody,
  Share,
  ShareExpiryBody,
  UpdateCategoryBody,
  UpdateItemBody,
} from "#shared/contracts";
import { apiFetch, type ApiFetcher } from "./api";

type CategoryRecord = Omit<Category, "items">;

export const catalogApi = {
  list(fetcher: ApiFetcher = $fetch) {
    return apiFetch<Category[]>(fetcher, "/api/categories");
  },
  createCategory(body: CreateCategoryBody, fetcher: ApiFetcher = $fetch) {
    return apiFetch<CategoryRecord>(fetcher, "/api/categories", { method: "POST", body });
  },
  updateCategory(id: number, body: UpdateCategoryBody, fetcher: ApiFetcher = $fetch) {
    return apiFetch<CategoryRecord>(fetcher, `/api/categories/${id}`, { method: "PATCH", body });
  },
  deleteCategory(id: number, fetcher: ApiFetcher = $fetch) {
    return apiFetch<null>(fetcher, `/api/categories/${id}`, { method: "DELETE" });
  },
  createItem(categoryId: number, body: CreateItemBody, fetcher: ApiFetcher = $fetch) {
    return apiFetch<Item>(fetcher, `/api/categories/${categoryId}/items`, { method: "POST", body });
  },
  updateItem(id: number, body: UpdateItemBody, fetcher: ApiFetcher = $fetch) {
    return apiFetch<Item>(fetcher, `/api/items/${id}`, { method: "PATCH", body });
  },
  deleteItem(id: number, fetcher: ApiFetcher = $fetch) {
    return apiFetch<null>(fetcher, `/api/items/${id}`, { method: "DELETE" });
  },
  reorderItems(categoryId: number, body: ReorderCategoryItemsBody, fetcher: ApiFetcher = $fetch) {
    return apiFetch<null>(fetcher, `/api/categories/${categoryId}/items/reorder`, { method: "PATCH", body });
  },
  reorderTracks(itemId: number, body: ReorderItemTracksBody, fetcher: ApiFetcher = $fetch) {
    return apiFetch<null>(fetcher, `/api/items/${itemId}/tracks/reorder`, { method: "PATCH", body });
  },
  createShare(categoryId: number, body: ShareExpiryBody = {}, fetcher: ApiFetcher = $fetch) {
    return apiFetch<Share>(fetcher, `/api/categories/${categoryId}/share`, { method: "POST", body });
  },
  rotateShare(categoryId: number, body: ShareExpiryBody = {}, fetcher: ApiFetcher = $fetch) {
    return apiFetch<Share>(fetcher, `/api/categories/${categoryId}/share/rotate`, { method: "POST", body });
  },
  revokeShare(categoryId: number, fetcher: ApiFetcher = $fetch) {
    return apiFetch<null>(fetcher, `/api/categories/${categoryId}/share`, { method: "DELETE" });
  },
};
