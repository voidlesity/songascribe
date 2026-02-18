<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body p-4">
      <!-- Song Info and Album Art -->
      <div class="flex items-center gap-3 mb-3">
        <div class="avatar">
          <div class="w-16 h-16 rounded-lg">
            <img
              v-if="currentSong?.album_art"
              :src="currentSong.album_art"
              :alt="currentSong.name"
            />
            <div
              v-else
              class="bg-base-300 w-full h-full flex items-center justify-center"
            >
              <Icon name="ic:round-library-music" size="1.5rem" />
            </div>
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <div class="font-semibold truncate text-sm">
            {{ currentSong?.name || "No song selected" }}
          </div>
          <div class="text-xs opacity-70 truncate">
            {{ currentSong?.artist || "Unknown artist" }}
          </div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-1">
          <button
            v-if="songs.length > 1"
            class="btn btn-ghost btn-sm btn-circle"
            :disabled="currentIndex === 0"
            @click="previous"
          >
            <Icon name="ic:round-skip-previous" size="1.2rem" />
          </button>

          <button
            class="btn btn-primary btn-sm btn-circle"
            @click="togglePlay"
            :disabled="!currentSong"
          >
            <Icon v-if="isPlaying" name="ic:round-pause" size="1.2rem" />
            <Icon v-else name="ic:round-play-arrow" size="1.2rem" />
          </button>

          <button
            v-if="songs.length > 1"
            class="btn btn-ghost btn-sm btn-circle"
            :disabled="currentIndex >= songs.length - 1"
            @click="next"
          >
            <Icon name="ic:round-skip-next" size="1.2rem" />
          </button>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="space-y-1">
        <input
          type="range"
          min="0"
          :max="duration || 100"
          :value="currentTime"
          class="range range-xs range-primary"
          @input="seek"
        />
        <div class="flex justify-between text-xs opacity-70">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- Volume Control -->
      <div class="flex items-center gap-2 mt-2">
        <Icon
          :name="
            volume === 0
              ? 'ic:round-volume-off'
              : volume < 50
                ? 'ic:round-volume-down'
                : 'ic:round-volume-up'
          "
          size="1rem"
          class="opacity-70"
        />
        <input
          v-model.number="volume"
          type="range"
          min="0"
          max="100"
          class="range range-xs flex-1"
        />
      </div>

      <!-- Queue Toggle -->
      <div v-if="songs.length > 1" class="mt-3">
        <button
          class="btn btn-ghost btn-sm w-full justify-between"
          @click="showQueue = !showQueue"
        >
          <span class="flex items-center gap-2">
            <Icon name="ic:round-queue-music" size="1rem" />
            Queue ({{ songs.length }})
          </span>
          <Icon
            :name="showQueue ? 'ic:round-expand-less' : 'ic:round-expand-more'"
            size="1rem"
          />
        </button>

        <!-- Queue List -->
        <div v-if="showQueue" class="mt-2 space-y-1 max-h-48 overflow-y-auto">
          <div
            v-for="(song, index) in songs"
            :key="song.id"
            class="flex items-center gap-2 p-2 rounded-lg hover:bg-base-300 cursor-pointer transition-colors"
            :class="{ 'bg-base-300': index === currentIndex }"
            @click="playSong(index)"
          >
            <div class="avatar">
              <div class="w-8 h-8 rounded">
                <img
                  v-if="song.album_art"
                  :src="song.album_art"
                  :alt="song.name"
                />
                <div
                  v-else
                  class="bg-base-300 w-full h-full flex items-center justify-center"
                >
                  <Icon name="ic:round-library-music" size="0.75rem" />
                </div>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-xs font-semibold truncate">{{ song.name }}</div>
              <div class="text-xs opacity-70 truncate">{{ song.artist }}</div>
            </div>
            <Icon
              v-if="index === currentIndex && isPlaying"
              name="ic:round-graphic-eq"
              size="1rem"
              class="text-primary"
            />
          </div>
        </div>
      </div>

      <!-- Loading Warning -->
      <div
        v-if="currentSong && isLoadingStream"
        class="alert alert-info py-2 mt-3"
      >
        <Icon name="ic:round-info" size="1rem" />
        <span class="text-xs">Loading track...</span>
      </div>
    </div>

    <!-- Audio Element -->
    <audio
      ref="audioElement"
      @timeupdate="updateProgress"
      @loadedmetadata="onMetadataLoaded"
      @ended="onSongEnd"
      @play="isPlaying = true"
      @pause="isPlaying = false"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  songs: {
    type: Array,
    required: true,
    default: () => [],
  },
  autoPlay: {
    type: Boolean,
    default: false,
  },
});

const audioElement = ref(null);
const currentIndex = ref(0);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(70);
const showQueue = ref(false);
const isLoadingStream = ref(false);
const currentStreamUrl = ref(null);

const currentSong = computed(() => props.songs[currentIndex.value] || null);

// Watch volume changes
watch(volume, (newVolume) => {
  if (audioElement.value) {
    audioElement.value.volume = newVolume / 100;
  }
});

// Watch current song changes
watch(currentSong, async (newSong) => {
  if (newSong && audioElement.value) {
    await loadSongStream(newSong);
    if (props.autoPlay || isPlaying.value) {
      playAudio();
    }
  }
});

// Watch songs prop changes
watch(
  () => props.songs,
  (newSongs) => {
    if (newSongs.length > 0 && currentIndex.value >= newSongs.length) {
      currentIndex.value = 0;
    }
  },
  { deep: true },
);

async function loadSongStream(song) {
  if (!song) return;

  isLoadingStream.value = true;

  try {
    // If we have a track_id, use it to get the stream URL
    if (song.track_id || song.trackId) {
      const streamData = await $fetch(
        `/api/lavalink/stream?trackId=${encodeURIComponent(song.track_id || song.trackId)}`,
      );
      currentStreamUrl.value = streamData.streamUrl;
      if (audioElement.value) {
        audioElement.value.src = streamData.streamUrl;
      }
    } else if (song.url) {
      // Fallback to direct URL if available
      currentStreamUrl.value = song.url;
      if (audioElement.value) {
        audioElement.value.src = song.url;
      }
    }
  } catch (error) {
    console.error("Error loading stream:", error);
  } finally {
    isLoadingStream.value = false;
  }
}

function togglePlay() {
  if (!currentSong.value) return;

  if (isPlaying.value) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function playAudio() {
  if (audioElement.value && currentSong.value?.previewUrl) {
    audioElement.value.play().catch((error) => {
      console.error("Error playing audio:", error);
      isPlaying.value = false;
    });
  }
}

function pauseAudio() {
  if (audioElement.value) {
    audioElement.value.pause();
  }
}

function next() {
  if (currentIndex.value < props.songs.length - 1) {
    currentIndex.value++;
  }
}

function previous() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
}

async function playSong(index) {
  currentIndex.value = index;
  if (currentSong.value) {
    await loadSongStream(currentSong.value);
    setTimeout(() => playAudio(), 100);
  }
}

function updateProgress() {
  if (audioElement.value) {
    currentTime.value = audioElement.value.currentTime;
  }
}

function onMetadataLoaded() {
  if (audioElement.value) {
    duration.value = audioElement.value.duration;
  }
}

function onSongEnd() {
  if (currentIndex.value < props.songs.length - 1) {
    next();
  } else {
    isPlaying.value = false;
    currentTime.value = 0;
  }
}

function seek(event) {
  if (!audioElement.value || !duration.value) return;
  const seekTime = parseFloat(event.target.value);
  audioElement.value.currentTime = seekTime;
  currentTime.value = seekTime;
}

function formatTime(seconds) {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// Initialize
onMounted(async () => {
  if (audioElement.value) {
    audioElement.value.volume = volume.value / 100;
    if (currentSong.value) {
      await loadSongStream(currentSong.value);
    }
  }
});

// Cleanup
onBeforeUnmount(() => {
  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value.src = "";
  }
});
</script>
