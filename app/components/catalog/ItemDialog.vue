<template>
  <UiBaseDialog
    :open="open"
    :title="isEdit ? 'Edit item' : 'New item'"
    size="lg"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="save">
      <div v-if="!isEdit && categories.length > 1">
        <label class="floating-label">
          <select v-model="form.categoryId" class="select w-full" required>
            <option disabled :value="null">Choose…</option>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
          <span>Category</span>
        </label>
      </div>

      <label class="floating-label">
        <input
          v-model="form.name"
          type="text"
          placeholder="Name"
          class="input w-full"
          required
        />
        <span>Item name</span>
      </label>

      <label class="floating-label">
        <textarea
          v-model="form.description"
          class="textarea w-full min-h-20"
          placeholder="Description"
          maxlength="5000"
        />
        <span>Description (optional)</span>
      </label>

      <TracksOrderEditor v-model="form.tracks" />
      <p v-if="error" class="alert alert-error text-sm">{{ error }}</p>

      <div class="modal-action mt-6">
        <button
          v-if="isEdit"
          type="button"
          class="btn btn-error btn-outline mr-auto"
          :disabled="saving"
          @click="confirmingDelete = true"
        >
          <Icon name="mdi:trash-can" /> Delete
        </button>
        <button type="button" class="btn btn-ghost" :disabled="saving" @click="emit('close')">
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!canSave || saving"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs" />
          {{ isEdit ? "Save" : "Create" }}
        </button>
      </div>
    </form>
  </UiBaseDialog>

  <UiConfirmDialog
    :open="confirmingDelete"
    title="Delete item?"
    :message="`Delete &quot;${item?.name ?? ''}&quot;? This cannot be undone.`"
    confirm-label="Delete item"
    danger
    :busy="saving"
    :error="error"
    @cancel="confirmingDelete = false"
    @confirm="remove"
  />
</template>

<script setup lang="ts">
import type { Category, Item } from "#shared/contracts";
import type { Track } from "~/composables/useTrackSearch";
import { getApiErrorMessage } from "~/services/api";

const props = defineProps<{
  open: boolean;
  item?: Item | null;
  categories: Category[];
  defaultCategoryId?: number | null;
}>();
const emit = defineEmits<{ close: []; saved: [] }>();
const { createItem, updateItem, deleteItem } = useCategories();

const form = reactive<{
  name: string;
  description: string;
  categoryId: number | null;
  tracks: Track[];
}>({ name: "", description: "", categoryId: null, tracks: [] });
const saving = ref(false);
const error = ref("");
const confirmingDelete = ref(false);
const isEdit = computed(() => !!props.item);
const canSave = computed(
  () =>
    !!form.name.trim() &&
    form.tracks.length > 0 &&
    (isEdit.value || form.categoryId !== null),
);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    form.name = props.item?.name ?? "";
    form.description = props.item?.description ?? "";
    form.categoryId =
      props.defaultCategoryId ?? props.categories[0]?.id ?? null;
    form.tracks = props.item ? props.item.tracks.map((track) => ({ ...track })) : [];
    error.value = "";
    confirmingDelete.value = false;
  },
);

async function save() {
  if (!canSave.value) return;
  saving.value = true;
  error.value = "";
  const body = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    tracks: form.tracks,
  };
  try {
    if (props.item) await updateItem(props.item.id, body);
    else await createItem(form.categoryId!, body);
    emit("saved");
    emit("close");
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Failed to save item");
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.item) return;
  saving.value = true;
  error.value = "";
  try {
    await deleteItem(props.item.id);
    emit("saved");
    confirmingDelete.value = false;
    emit("close");
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Failed to delete item");
  } finally {
    saving.value = false;
  }
}
</script>
