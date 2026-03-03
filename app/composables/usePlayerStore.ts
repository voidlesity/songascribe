interface SongInfo {
  identifier?: string;
  title?: string;
  author?: string;
  length?: number;
  uri?: string;
  artworkUrl?: string;
  sourceName?: string;
}

interface Song {
  encoded?: string;
  info?: SongInfo;
}

interface QueueItem {
  song: Song;
  itemName?: string;
}

const queue = ref<QueueItem[]>([]);
const currentIndex = ref<number>(-1);
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
    : null
);

const currentSong = computed(() => currentQueueItem.value?.song || null);

export function usePlayerStore() {
  function playSong(song: Song, itemName?: string) {
    const existingIndex = queue.value.findIndex(
      (q) => q.song.encoded === song.encoded
    );

    if (existingIndex >= 0) {
      currentIndex.value = existingIndex;
    } else {
      queue.value.push({ song, itemName });
      currentIndex.value = queue.value.length - 1;
    }

    isPlaying.value = true;
  }

  function playMultiple(songs: Song[], itemName?: string, startIndex = 0) {
    // Clear existing queue and add all songs
    queue.value = songs.map((song) => ({ song, itemName }));
    currentIndex.value = Math.min(startIndex, songs.length - 1);
    isPlaying.value = true;
  }

  function addToQueue(song: Song, itemName?: string) {
    queue.value.push({ song, itemName });
    // If nothing is playing, start playing
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
      // If we removed the current song, keep index but cap it
      if (currentIndex.value >= queue.value.length) {
        currentIndex.value = queue.value.length - 1;
      }
      // Trigger re-play of the new current song
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
      const randomIndex = Math.floor(Math.random() * queue.value.length);
      currentIndex.value = randomIndex;
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
    // If more than 3 seconds in, restart the song
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
    if (repeat.value === "off") repeat.value = "all";
    else if (repeat.value === "all") repeat.value = "one";
    else repeat.value = "off";
  }

  function formatTime(seconds: number): string {
    if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function isCurrentSong(song: Song): boolean {
    if (!currentSong.value || !song) return false;
    return currentSong.value.encoded === song.encoded;
  }

  return {
    // State
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

    // Computed
    currentQueueItem,
    currentSong,

    // Actions
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
