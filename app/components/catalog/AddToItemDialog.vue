<template>
  <dialog :class="['modal', { 'modal-open': !!track }]">
    <div class="modal-box max-w-lg">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        @click="close"
      >
        ✕
      </button>

      <h3 class="text-lg font-semibold mb-3">Add song to items</h3>

      <!-- Selected track summary -->
      <div
        v-if="track"
        class="flex items-center gap-2 bg-base-200 rounded-box p-2 mb-4"
      >
        <TrackArt :track="track" size="sm" />
        <div class="min-w-0">
          <div class="text-sm font-medium truncate">{{ track.title }}</div>
          <div class="text-xs opacity-60 truncate">{{ track.author }}</div>
        </div>
      </div>

      <div v-if="loading" class="flex justify-center py-8">
        <span class="loading loading-spinner loading-lg" />
      </div>

      <p v-else-if="error" class="alert alert-error text-sm mb-3">{{ error }}</p>

      <template v-else>
        <!-- Existing items grouped by category -->
        <div class="max-h-72 overflow-y-auto pr-1 space-y-4">
          <div v-for="c in categories" :key="c.id">
            <div class="flex items-center gap-2 mb-1">
              <Icon
                :name="c.isPublic ? 'mdi:earth' : 'mdi:folder'"
                class="opacity-60 text-sm"
              />
              <span class="text-xs uppercase opacity-60 font-medium">
                {{ c.name }}
              </span>
            </div>

            <ul class="menu menu-sm bg-base-200 rounded-box w-full p-1">
              <li v-for="item in c.items" :key="item.id">
                <label
                  class="flex items-center gap-2"
                  :class="{
                    'opacity-50 cursor-not-allowed': itemHasTrack(item),
                  }"
                >
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :checked="itemHasTrack(item) || selected.has(item.id)"
                    :disabled="itemHasTrack(item)"
                    @change="toggle(item.id)"
                  />
                  <span class="flex-1 truncate">{{ item.name }}</span>
                  <span
                    v-if="itemHasTrack(item)"
                    class="badge badge-ghost badge-xs"
                  >
                    Added
                  </span>
                </label>
              </li>
              <li v-if="!c.items.length" class="disabled">
                <span class="text-xs opacity-50">No items yet</span>
              </li>
            </ul>
          </div>

          <p
            v-if="!categories.length"
            class="text-center text-sm opacity-60 py-4"
          >
            No categories yet — create one below.
          </p>
        </div>

        <!-- Create a new item -->
        <div class="divider my-3 text-xs opacity-60">or create a new item</div>

        <div class="space-y-2">
          <div class="flex gap-2">
            <input
              v-model="newName"
              type="text"
              placeholder="New item name"
              class="input input-sm flex-1"
            />
            <select
              v-if="categories.length > 1"
              v-model="newCategoryId"
              class="select select-sm w-40"
            >
              <option v-for="c in categories" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>
          <p v-if="!categories.length" class="text-xs opacity-60">
            You need a category before creating an item.
          </p>
        </div>

        <div class="modal-action mt-5">
          <button class="btn btn-ghost" :disabled="saving" @click="close">
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="!canSubmit || saving"
            @click="submit"
          >
            <span v-if="saving" class="loading loading-spinner loading-xs" />
            {{ submitLabel }}
          </button>
        </div>
      </template>
    </div>

    <form method="dialog" class="modal-backdrop" @submit.prevent="close">
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
import type { Item } from "~/composables/useCategories";
import type { Track } from "~/composables/useTrackSearch";
import { getApiErrorMessage } from "~/services/api";

const props = defineProps<{ track: Track | null }>();
const emit = defineEmits<{ close: []; added: [] }>();

const { categories, refresh, createItem, updateItem } = useCategories();

const loading = ref(false);
const saving = ref(false);
const error = ref("");
const selected = ref<Set<number>>(new Set());
const newName = ref("");
const newCategoryId = ref<number | null>(null);

watch(
  () => props.track,
  async (track) => {
    if (!track) return;
    selected.value = new Set();
    newName.value = "";
    error.value = "";

    // Ensure we have an up-to-date category/item list to file into.
    loading.value = true;
    try {
      await refresh();
    } catch (cause) {
      error.value = getApiErrorMessage(cause, "Failed to load your library");
    } finally {
      loading.value = false;
    }
    newCategoryId.value = categories.value[0]?.id ?? null;
  },
);

function itemHasTrack(item: Item): boolean {
  if (!props.track) return false;
  return item.tracks.some((t) => t.encoded === props.track!.encoded);
}

function toggle(itemId: number) {
  const next = new Set(selected.value);
  if (next.has(itemId)) next.delete(itemId);
  else next.add(itemId);
  selected.value = next;
}

const willCreate = computed(
  () => newName.value.trim() !== "" && newCategoryId.value != null,
);

const canSubmit = computed(() => selected.value.size > 0 || willCreate.value);

const submitLabel = computed(() => {
  const count = selected.value.size + (willCreate.value ? 1 : 0);
  return count > 1 ? `Add to ${count} items` : "Add";
});

function findItem(id: number): Item | undefined {
  for (const c of categories.value) {
    const found = c.items.find((i) => i.id === id);
    if (found) return found;
  }
  return undefined;
}

async function submit() {
  const track = props.track;
  if (!track || !canSubmit.value) return;

  saving.value = true;
  error.value = "";
  try {
    const newTrack: Track = { ...track, reason: "" };

    // Append to each selected existing item (skipping any that already have it).
    for (const id of selected.value) {
      const item = findItem(id);
      if (!item || itemHasTrack(item)) continue;
      await updateItem(id, {
        name: item.name,
        tracks: [...item.tracks, newTrack],
      });
    }

    // Optionally create a brand-new item holding this track.
    if (willCreate.value) {
      await createItem(newCategoryId.value!, {
        name: newName.value.trim(),
        tracks: [newTrack],
      });
    }

    emit("added");
    close();
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Failed to add track");
  } finally {
    saving.value = false;
  }
}

function close() {
  emit("close");
}
</script>
