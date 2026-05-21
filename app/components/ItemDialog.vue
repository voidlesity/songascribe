<template>
  <dialog :class="['modal', { 'modal-open': open }]">
    <div class="modal-box max-w-2xl">
      <h3 class="text-lg font-semibold mb-4">
        {{ isEdit ? "Edit item" : "New item" }}
      </h3>

      <form class="space-y-4" @submit.prevent="save">
        <div v-if="!isEdit && categories.length > 1">
          <label class="floating-label">
            <select v-model="form.categoryId" class="select w-full" required>
              <option disabled :value="null">Choose…</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">
                {{ c.name }}
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
          >
          <span>Item name</span>
        </label>

        <div>
          <p class="text-sm font-medium mb-2">Songs</p>
          <TrackSearch placeholder="Search or paste URL…" @select="addTrack" />
        </div>

        <ul v-if="form.tracks.length" class="list bg-base-200 rounded-box">
          <li
            v-for="(song, idx) in form.tracks"
            :key="song.encoded || idx"
            class="list-row p-2"
          >
            <TrackArt :track="song" size="sm" />
            <div class="list-col-grow min-w-0">
              <div class="truncate text-sm font-medium">
                {{ song.title || "Unknown" }}
              </div>
              <div class="truncate text-xs opacity-60">
                {{ song.author || "Unknown artist" }}
              </div>
            </div>
            <div class="join">
              <button
                type="button"
                class="btn btn-ghost btn-xs join-item"
                :disabled="idx === 0"
                @click="move(idx, -1)"
              >
                <Icon name="mdi:arrow-up" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs join-item"
                :disabled="idx === form.tracks.length - 1"
                @click="move(idx, 1)"
              >
                <Icon name="mdi:arrow-down" />
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs join-item text-error"
                @click="removeTrack(idx)"
              >
                <Icon name="mdi:close" />
              </button>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm opacity-60 text-center py-3">
          Add at least one song
        </p>

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
            :disabled="
              !form.name.trim() ||
              !form.tracks.length ||
              saving ||
              (!isEdit && !form.categoryId)
            "
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
import type { Category, Item } from "~/composables/useCategories";
import type { Track } from "~/composables/useTrackSearch";

const props = defineProps<{
  open: boolean;
  item?: Item | null;
  categories: Category[];
  defaultCategoryId?: number | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const { createItem, updateItem, deleteItem } = useCategories();

const form = ref<{ name: string; categoryId: number | null; tracks: Track[] }>({
  name: "",
  categoryId: null,
  tracks: [],
});
const saving = ref(false);
const isEdit = computed(() => !!props.item);

watch(
  () => props.open,
  (v) => {
    if (!v) return;
    form.value = props.item
      ? {
          name: props.item.name,
          categoryId: props.defaultCategoryId ?? null,
          tracks: [...props.item.tracks],
        }
      : {
          name: "",
          categoryId:
            props.defaultCategoryId ?? props.categories[0]?.id ?? null,
          tracks: [],
        };
  },
);

function addTrack(track: Track) {
  if (form.value.tracks.some((t) => t.encoded === track.encoded)) return;
  form.value.tracks.push(track);
}

function removeTrack(idx: number) {
  form.value.tracks.splice(idx, 1);
}

function move(idx: number, dir: -1 | 1) {
  const next = idx + dir;
  if (next < 0 || next >= form.value.tracks.length) return;
  const arr = form.value.tracks;
  const a = arr[idx];
  const b = arr[next];
  if (!a || !b) return;
  arr[idx] = b;
  arr[next] = a;
}

async function save() {
  if (!form.value.name.trim() || !form.value.tracks.length) return;
  if (!isEdit.value && !form.value.categoryId) return;
  saving.value = true;
  try {
    const body = { name: form.value.name.trim(), tracks: form.value.tracks };
    if (isEdit.value && props.item) {
      await updateItem(props.item.id, body);
    } else {
      await createItem(form.value.categoryId!, body);
    }
    emit("saved");
    emit("close");
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!props.item) return;
  if (!confirm(`Delete "${props.item.name}"?`)) return;
  saving.value = true;
  try {
    await deleteItem(props.item.id);
    emit("saved");
    emit("close");
  } finally {
    saving.value = false;
  }
}
</script>
