import type { Track } from "./useTrackSearch";

export interface PlayerQueueItem {
  /** Stable for the lifetime of this queue entry, even when tracks repeat. */
  id: string;
  song: Track;
  itemName?: string;
  /** Identifies the item/list context independently from the encoded track. */
  contextId?: string;
}

export interface RemoveQueueItemResult {
  removed: boolean;
  removedCurrent: boolean;
  emptied: boolean;
}

const queue = ref<PlayerQueueItem[]>([]);
const currentIndex = ref(-1);
let nextQueueEntryId = 1;

const currentQueueItem = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < queue.value.length
    ? (queue.value[currentIndex.value] ?? null)
    : null,
);

function resolvedContextId(itemName?: string, contextId?: string) {
  return contextId ?? itemName;
}

function createQueueItem(
  song: Track,
  itemName?: string,
  contextId?: string,
): PlayerQueueItem {
  const queueContextId = resolvedContextId(itemName, contextId);
  return {
    id: `queue-entry-${nextQueueEntryId++}`,
    song,
    ...(itemName !== undefined ? { itemName } : {}),
    ...(queueContextId !== undefined ? { contextId: queueContextId } : {}),
  };
}

export function usePlayerQueue() {
  function selectOrAppend(
    song: Track,
    itemName?: string,
    contextId?: string,
  ) {
    const resolvedContext = resolvedContextId(itemName, contextId);
    const existing = queue.value.findIndex(
      (entry) =>
        entry.song.encoded === song.encoded &&
        entry.contextId === resolvedContext,
    );

    if (existing >= 0) {
      currentIndex.value = existing;
      return existing;
    }

    queue.value.push(createQueueItem(song, itemName, contextId));
    currentIndex.value = queue.value.length - 1;
    return currentIndex.value;
  }

  function replace(
    songs: Track[],
    itemName?: string,
    startIndex = 0,
    contextId?: string,
  ) {
    queue.value = songs.map((song) =>
      createQueueItem(song, itemName, contextId),
    );
    currentIndex.value = Math.min(startIndex, songs.length - 1);
  }

  function append(song: Track, itemName?: string, contextId?: string) {
    queue.value.push(createQueueItem(song, itemName, contextId));
    if (currentIndex.value < 0) currentIndex.value = 0;
  }

  function remove(index: number): RemoveQueueItemResult {
    if (index < 0 || index >= queue.value.length) {
      return { removed: false, removedCurrent: false, emptied: false };
    }

    const removedCurrent = index === currentIndex.value;
    queue.value.splice(index, 1);

    if (queue.value.length === 0) {
      currentIndex.value = -1;
    } else if (index < currentIndex.value) {
      currentIndex.value--;
    } else if (removedCurrent && currentIndex.value >= queue.value.length) {
      currentIndex.value = queue.value.length - 1;
    }

    return {
      removed: true,
      removedCurrent,
      emptied: queue.value.length === 0,
    };
  }

  function clear() {
    queue.value = [];
    currentIndex.value = -1;
  }

  return {
    queue,
    currentIndex,
    currentQueueItem,
    selectOrAppend,
    replace,
    append,
    remove,
    clear,
  };
}
