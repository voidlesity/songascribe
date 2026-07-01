import type { Track } from "./useTrackSearch";

interface QueueItem {
  song: Track;
  itemName?: string;
}

const queue = ref<QueueItem[]>([]);
const currentIndex = ref(-1);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(70);
const isLoading = ref(false);
const iframeReady = ref(false);
const shuffle = ref(false);
const repeat = ref<"off" | "one" | "all">("off");

const currentQueueItem = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < queue.value.length
    ? queue.value[currentIndex.value]
    : null,
);

const currentSong = computed(() => currentQueueItem.value?.song || null);

export function usePlayerStore() {
  function playSong(song: Track, itemName?: string) {
    const existing = queue.value.findIndex(
      (q) => q.song.encoded === song.encoded,
    );
    if (existing >= 0) {
      currentIndex.value = existing;
    } else {
      queue.value.push({ song, itemName });
      currentIndex.value = queue.value.length - 1;
    }
    isPlaying.value = true;
  }

  function playMultiple(songs: Track[], itemName?: string, startIndex = 0) {
    queue.value = songs.map((song) => ({ song, itemName }));
    currentIndex.value = Math.min(startIndex, songs.length - 1);
    isPlaying.value = true;
  }

  function addToQueue(song: Track, itemName?: string) {
    queue.value.push({ song, itemName });
    if (currentIndex.value < 0) {
      currentIndex.value = 0;
      isPlaying.value = true;
    }
  }

  function removeFromQueue(index: number) {
    if (index < 0 || index >= queue.value.length) return;
    queue.value.splice(index, 1);

    if (queue.value.length === 0) {
      currentIndex.value = -1;
      isPlaying.value = false;
      currentTime.value = 0;
      duration.value = 0;
    } else if (index < currentIndex.value) {
      currentIndex.value--;
    } else if (index === currentIndex.value) {
      if (currentIndex.value >= queue.value.length) {
        currentIndex.value = queue.value.length - 1;
      }
      isPlaying.value = true;
    }
  }

  function clearQueue() {
    queue.value = [];
    currentIndex.value = -1;
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

  function setVolume(v: number) {
    volume.value = Math.max(0, Math.min(100, v));
  }

  function toggleShuffle() {
    shuffle.value = !shuffle.value;
  }

  function cycleRepeat() {
    repeat.value =
      repeat.value === "off" ? "all" : repeat.value === "all" ? "one" : "off";
  }

  function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
    iframeReady,
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
    formatTime,
    isCurrentSong,
  };
}
