<template>
  <dialog :class="['modal', { 'modal-open': open }]">
    <div class="modal-box">
      <h3 class="text-lg font-semibold mb-4">
        {{ isEdit ? "Edit category" : "New category" }}
      </h3>

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

        <label class="label cursor-pointer justify-start gap-3">
          <input
            v-model="form.isPublic"
            type="checkbox"
            class="toggle toggle-primary"
          />
          <span class="text-sm">Public | discoverable on Browse</span>
        </label>

        <p v-if="error" class="text-error text-sm">{{ error }}</p>

        <div class="modal-action mt-6">
          <button
            v-if="isEdit"
            type="button"
            class="btn btn-error btn-outline mr-auto"
            :disabled="saving"
            @click="remove"
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
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
      @submit.prevent="emit('close')"
    >
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import type { Category } from "~/composables/useCategories";

const props = defineProps<{
  open: boolean;
  category?: Category | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
  deleted: [];
}>();

const { createCategory, updateCategory, deleteCategory } = useCategories();

const form = ref({ name: "", isPublic: false });
const saving = ref(false);
const error = ref("");

const isEdit = computed(() => !!props.category);

watch(
  () => props.open,
  (v) => {
    if (v) {
      form.value = props.category
        ? { name: props.category.name, isPublic: props.category.isPublic }
        : { name: "", isPublic: false };
      error.value = "";
    }
  },
);

async function save() {
  if (!form.value.name.trim()) return;
  saving.value = true;
  error.value = "";
  try {
    if (isEdit.value && props.category) {
      await updateCategory(props.category.id, form.value);
    } else {
      await createCategory(form.value);
    }
    emit("saved");
    emit("close");
  } catch (e) {
    error.value = (e as Error).message || "Failed to save";
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.category) return;
  if (!confirm(`Delete "${props.category.name}" and all its items?`)) return;
  saving.value = true;
  try {
    await deleteCategory(props.category.id);
    emit("deleted");
    emit("close");
  } finally {
    saving.value = false;
  }
}
</script>
