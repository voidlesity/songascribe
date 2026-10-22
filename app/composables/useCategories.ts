type CategoryBody = Partial<
  Pick<Category, "name" | "description" | "isPublic">
>;
type ItemBody = Partial<Pick<Item, "name" | "description" | "position">> & {
  tracks?: Track[];
};

export function useCategories() {
  const categories = useState<Category[]>("catalog:categories", () => []);
  const loading = useState("catalog:loading", () => false);
  const error = useState("catalog:error", () => "");
  // Forwards the session cookie when `refresh` runs inside SSR `useAsyncData`.
  const requestFetch = useRequestFetch();

  function findCategory(id: number) {
    return categories.value.find((category) => category.id === id);
  }

  function findItem(id: number) {
    for (const category of categories.value) {
      const index = category.items.findIndex((item) => item.id === id);
      if (index !== -1) return { category, index };
    }
    return null;
  }

  async function refresh() {
    loading.value = true;
    error.value = "";
    try {
      categories.value = await requestFetch<Category[]>("/api/categories");
      return categories.value;
    } catch (cause) {
      error.value = getApiErrorMessage(cause, "Failed to load your library");
      throw cause;
    } finally {
      loading.value = false;
    }
  }

  async function createCategory(body: CategoryBody & { name: string }) {
    const created = await $fetch<Omit<Category, "items">>("/api/categories", {
      method: "POST",
      body,
    });
    const category: Category = { ...created, items: [] };
    categories.value.push(category);
    return category;
  }

  async function updateCategory(id: number, body: CategoryBody) {
    const updated = await $fetch<Omit<Category, "items">>(
      `/api/categories/${id}`,
      { method: "PATCH", body },
    );
    const category = findCategory(id);
    if (category) Object.assign(category, updated);
    return updated;
  }

  async function deleteCategory(id: number) {
    await $fetch(`/api/categories/${id}`, { method: "DELETE" });
    categories.value = categories.value.filter(
      (category) => category.id !== id,
    );
  }

  async function createItem(
    categoryId: number,
    body: ItemBody & { name: string },
  ) {
    const created = await $fetch<Item>(`/api/categories/${categoryId}/items`, {
      method: "POST",
      body,
    });
    const category = findCategory(categoryId);
    if (category) {
      category.items.push({ ...created, categoryId });
      category.items.sort((a, b) => a.position - b.position);
    }
    return created;
  }

  async function updateItem(id: number, body: ItemBody) {
    const updated = await $fetch<Item>(`/api/items/${id}`, {
      method: "PATCH",
      body,
    });
    const location = findItem(id);
    if (location) {
      location.category.items[location.index] = updated;
      location.category.items.sort((a, b) => a.position - b.position);
    }
    return updated;
  }

  async function deleteItem(id: number) {
    await $fetch(`/api/items/${id}`, { method: "DELETE" });
    const location = findItem(id);
    if (location) location.category.items.splice(location.index, 1);
  }

  async function reorderItems(categoryId: number, itemIds: number[]) {
    await $fetch(`/api/categories/${categoryId}/items/reorder`, {
      method: "PATCH",
      body: { itemIds },
    });
    const category = findCategory(categoryId);
    if (!category) return;
    const byId = new Map(category.items.map((item) => [item.id, item]));
    category.items = itemIds.flatMap((id, position) => {
      const item = byId.get(id);
      return item ? [{ ...item, position }] : [];
    });
  }

  async function reorderTracks(itemId: number, trackIds: number[]) {
    await $fetch(`/api/items/${itemId}/tracks/reorder`, {
      method: "PATCH",
      body: { trackIds },
    });
    const location = findItem(itemId);
    if (!location) return;
    const item = location.category.items[location.index]!;
    const remaining = [...item.tracks];
    item.tracks = trackIds.flatMap((id) => {
      const index = remaining.findIndex((track) => track.id === id);
      return index === -1 ? [] : remaining.splice(index, 1);
    });
  }

  function addImportedCategory(category: Category) {
    const index = categories.value.findIndex(
      (entry) => entry.id === category.id,
    );
    if (index === -1) categories.value.push(category);
    else categories.value[index] = category;
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
  };
}
