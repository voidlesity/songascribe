<template>
  <UiBaseDialog
    :open="open"
    :title="isEdit ? 'Edit category' : 'New category'"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="save">
      <label class="floating-label">
        <input
          v-model="form.name"
          type="text"
          placeholder="Name"
          class="input w-full"
          required
          autofocus
        />
        <span>Category name</span>
      </label>

      <label class="floating-label">
        <textarea
          v-model="form.description"
          class="textarea w-full min-h-24"
          placeholder="Description"
          maxlength="5000"
        />
        <span>Description (optional)</span>
      </label>

      <label class="label cursor-pointer justify-start gap-3">
        <input
          v-model="form.isPublic"
          type="checkbox"
          class="toggle toggle-primary"
        />
        <span class="text-sm">Public | discoverable on Browse</span>
      </label>

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
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="saving"
          @click="emit('close')"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="!form.name.trim() || saving"
        >
          <span v-if="saving" class="loading loading-spinner loading-xs" />
          {{ isEdit ? "Save" : "Create" }}
        </button>
      </div>
    </form>
  </UiBaseDialog>

  <UiConfirmDialog
    :open="confirmingDelete"
    title="Delete category?"
    :message="`Delete “${category?.name ?? ''}” and all its items? This cannot be undone.`"
    confirm-label="Delete category"
    danger
    :busy="saving"
    :error="error"
    @cancel="confirmingDelete = false"
    @confirm="remove"
  />
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; category?: Category | null }>();
const emit = defineEmits<{ close: []; deleted: [] }>();
const { createCategory, updateCategory, deleteCategory } = useCategories();

const form = reactive({ name: "", description: "", isPublic: false });
const saving = ref(false);
const error = ref("");
const confirmingDelete = ref(false);
const isEdit = computed(() => !!props.category);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    form.name = props.category?.name ?? "";
    form.description = props.category?.description ?? "";
    form.isPublic = props.category?.isPublic ?? false;
    error.value = "";
    confirmingDelete.value = false;
  },
);

async function save() {
  if (!form.name.trim()) return;
  saving.value = true;
  error.value = "";
  const body = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    isPublic: form.isPublic,
  };
  try {
    if (props.category) await updateCategory(props.category.id, body);
    else await createCategory(body);
    emit("close");
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Failed to save category");
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.category) return;
  saving.value = true;
  error.value = "";
  try {
    await deleteCategory(props.category.id);
    emit("deleted");
    confirmingDelete.value = false;
    emit("close");
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Failed to delete category");
  } finally {
    saving.value = false;
  }
}
</script>
