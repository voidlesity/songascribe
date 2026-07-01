import type { Track } from "./useTrackSearch";

export interface Item {
  id: number;
  name: string;
  description?: string | null;
  position?: number;
  tracks: Track[];
}

export interface Category {
  id: number;
  name: string;
  description?: string | null;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
  items: Item[];
}

const categories = ref<Category[]>([]);
const loading = ref(false);

export function useCategories() {
  async function refresh() {
    loading.value = true;
    try {
      categories.value = await $fetch<Category[]>("/api/categories");
    } finally {
      loading.value = false;
    }
  }

  async function createCategory(body: {
    name: string;
    description?: string | null;
    isPublic?: boolean;
  }) {
    await $fetch("/api/categories", { method: "POST", body });
    await refresh();
  }

  async function updateCategory(
    id: number,
    body: Partial<{
      name: string;
      description: string | null;
      isPublic: boolean;
    }>,
  ) {
    await $fetch(`/api/categories/${id}`, { method: "PATCH", body });
    await refresh();
  }

  async function deleteCategory(id: number) {
    await $fetch(`/api/categories/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function createItem(
    categoryId: number,
    body: { name: string; tracks: Track[] },
  ) {
    await $fetch(`/api/categories/${categoryId}/items`, {
      method: "POST",
      body,
    });
    await refresh();
  }

  async function updateItem(
    id: number,
    body: { name?: string; tracks?: Track[] },
  ) {
    await $fetch(`/api/items/${id}`, { method: "PATCH", body });
    await refresh();
  }

  async function deleteItem(id: number) {
    await $fetch(`/api/items/${id}`, { method: "DELETE" });
    await refresh();
  }

  async function createShare(categoryId: number) {
    const result = await $fetch<{ url: string; token: string }>(
      `/api/categories/${categoryId}/share`,
      { method: "POST" },
    );
    return result;
  }

  return {
    categories,
    loading,
    refresh,
    createCategory,
    updateCategory,
    deleteCategory,
    createItem,
    updateItem,
    deleteItem,
    createShare,
  };
}
