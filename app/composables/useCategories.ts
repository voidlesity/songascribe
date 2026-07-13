import type {
  Category,
  CreateCategoryBody,
  CreateItemBody,
  ShareExpiryBody,
  UpdateCategoryBody,
  UpdateItemBody,
} from "#shared/contracts";
import type { ApiFetcher } from "~/services/api";
import { getApiErrorMessage } from "~/services/api";
import { catalogApi } from "~/services/catalog";

export type { Category, Item } from "#shared/contracts";

export function useCategories() {
  const categories = useState<Category[]>("catalog:categories", () => []);
  const loading = useState("catalog:loading", () => false);
  const error = useState("catalog:error", () => "");

  function findItem(id: number) {
    for (const category of categories.value) {
      const index = category.items.findIndex((item) => item.id === id);
      if (index !== -1) return { category, index };
    }
    return null;
  }

  async function refresh(fetcher: ApiFetcher = $fetch) {
    loading.value = true;
    error.value = "";
    try {
      categories.value = await catalogApi.list(fetcher);
      return categories.value;
    } catch (cause) {
      error.value = getApiErrorMessage(cause, "Failed to load your library");
      throw cause;
    } finally {
      loading.value = false;
    }
  }

  async function createCategory(body: CreateCategoryBody) {
    const created = await catalogApi.createCategory(body);
    const category: Category = { ...created, items: [] };
    categories.value.push(category);
    return category;
  }

  async function updateCategory(id: number, body: UpdateCategoryBody) {
    const updated = await catalogApi.updateCategory(id, body);
    const index = categories.value.findIndex((category) => category.id === id);
    if (index !== -1) {
      const current = categories.value[index]!;
      categories.value[index] = { ...current, ...updated, items: current.items };
    }
    return updated;
  }

  async function deleteCategory(id: number) {
    await catalogApi.deleteCategory(id);
    const index = categories.value.findIndex((category) => category.id === id);
    if (index !== -1) categories.value.splice(index, 1);
  }

  async function createItem(categoryId: number, body: CreateItemBody) {
    const created = await catalogApi.createItem(categoryId, body);
    const category = categories.value.find((entry) => entry.id === categoryId);
    if (category) {
      category.items.push({ ...created, categoryId });
      category.items.sort((a, b) => a.position - b.position);
    }
    return created;
  }

  async function updateItem(id: number, body: UpdateItemBody) {
    const updated = await catalogApi.updateItem(id, body);
    const location = findItem(id);
    if (location) {
      location.category.items[location.index] = updated;
      location.category.items.sort((a, b) => a.position - b.position);
    }
    return updated;
  }

  async function deleteItem(id: number) {
    await catalogApi.deleteItem(id);
    const location = findItem(id);
    if (location) location.category.items.splice(location.index, 1);
  }

  async function reorderItems(categoryId: number, itemIds: number[]) {
    await catalogApi.reorderItems(categoryId, { itemIds });
    const category = categories.value.find((entry) => entry.id === categoryId);
    if (!category) return;
    const byId = new Map(category.items.map((item) => [item.id, item]));
    category.items = itemIds.flatMap((id, position) => {
      const item = byId.get(id);
      return item ? [{ ...item, position }] : [];
    });
  }

  async function reorderTracks(itemId: number, trackIds: number[]) {
    await catalogApi.reorderTracks(itemId, { trackIds });
    const location = findItem(itemId);
    if (!location) return;
    const remaining = [...location.category.items[location.index]!.tracks];
    location.category.items[location.index]!.tracks = trackIds.flatMap(
      (id, position) => {
        const index = remaining.findIndex((track) => track.id === id);
        if (index === -1) return [];
        const [track] = remaining.splice(index, 1);
        return track ? [{ ...track, position }] : [];
      },
    );
  }

  function addImportedCategory(category: Category) {
    const index = categories.value.findIndex((entry) => entry.id === category.id);
    if (index === -1) categories.value.push(category);
    else categories.value[index] = category;
  }

  function createShare(categoryId: number, body: ShareExpiryBody = {}) {
    return catalogApi.createShare(categoryId, body);
  }

  return {
    categories,
    loading,
    error,
    refresh,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    reorderItems,
    reorderTracks,
    addImportedCategory,
    createShare,
  };
}
