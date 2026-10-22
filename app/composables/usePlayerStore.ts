const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(70);
const isLoading = ref(false);
const shuffle = ref(false);
const repeat = ref<"off" | "one" | "all">("off");

export function usePlayerStore() {
  const playerQueue = usePlayerQueue();
  const { queue, currentIndex, currentQueueItem } = playerQueue;
  const currentSong = computed(() => currentQueueItem.value?.song || null);

  function playSong(song: Track, itemName?: string, contextId?: string) {
    playerQueue.selectOrAppend(song, itemName, contextId);
    isPlaying.value = true;
  }

  function playMultiple(
    songs: Track[],
    itemName?: string,
    startIndex = 0,
    contextId?: string,
  ) {
    playerQueue.replace(songs, itemName, startIndex, contextId);
    isPlaying.value = true;
  }

  function addToQueue(song: Track, itemName?: string, contextId?: string) {
    const hadSelection = currentIndex.value >= 0;
    playerQueue.append(song, itemName, contextId);
    if (!hadSelection) isPlaying.value = true;
  }

  function removeFromQueue(index: number) {
    const result = playerQueue.remove(index);
    if (!result.removed) return;

    if (result.emptied) {
      isPlaying.value = false;
      currentTime.value = 0;
      duration.value = 0;
    } else if (result.removedCurrent) {
      isPlaying.value = true;
    }
  }

  function clearQueue() {
    playerQueue.clear();
    isPlaying.value = false;
    currentTime.value = 0;
    duration.value = 0;
  }

  function togglePlay() {
    if (currentIndex.value < 0 && queue.value.length > 0) {
      currentIndex.value = 0;
      isPlaying.value = true;
      return;
    }
    isPlaying.value = !isPlaying.value;
  }

  function next() {
    if (queue.value.length === 0) return;
    if (shuffle.value) {
      currentIndex.value = Math.floor(Math.random() * queue.value.length);
    } else if (currentIndex.value < queue.value.length - 1) {
      currentIndex.value++;
    } else if (repeat.value === "all") {
      currentIndex.value = 0;
    } else {
      isPlaying.value = false;
      return;
    }
    isPlaying.value = true;
  }

  function previous() {
    if (currentTime.value > 3) {
      currentTime.value = 0;
      return;
    }
    if (currentIndex.value > 0) {
      currentIndex.value--;
      isPlaying.value = true;
    } else if (repeat.value === "all") {
      currentIndex.value = queue.value.length - 1;
      isPlaying.value = true;
    }
  }

  function onTrackEnd() {
    if (repeat.value === "one") {
      currentTime.value = 0;
      isPlaying.value = true;
      return;
    }
    next();
  }

  function seekTo(time: number) {
    currentTime.value = time;
  }

  function setVolume(value: number) {
    volume.value = Math.max(0, Math.min(100, value));
  }

  function toggleShuffle() {
    shuffle.value = !shuffle.value;
  }

  function cycleRepeat() {
    repeat.value =
      repeat.value === "off" ? "all" : repeat.value === "all" ? "one" : "off";
  }

  function isCurrentSong(song: Track | null | undefined): boolean {
    if (!currentSong.value || !song) return false;
    return currentSong.value.encoded === song.encoded;
  }

  return {
    queue,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isLoading,
    shuffle,
    repeat,
    currentQueueItem,
    currentSong,
    playSong,
    playMultiple,
    addToQueue,
    removeFromQueue,
    clearQueue,
    togglePlay,
    next,
    previous,
    onTrackEnd,
    seekTo,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    isCurrentSong,
  };
}
