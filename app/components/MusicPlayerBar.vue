<template>
  <!-- Persistent bottom music player bar -->
  <div
    v-if="currentSong"
    class="fixed bottom-0 left-0 right-0 z-50 bg-base-300 border-t border-base-content/10 shadow-2xl"
  >
    <!-- Progress bar (thin clickable bar at very top) -->
    <div
      class="relative h-1.5 bg-base-content/10 cursor-pointer group"
      @click="onProgressClick"
      @mousedown="startDrag"
    >
      <div
        class="absolute inset-y-0 left-0 bg-primary transition-all duration-100"
        :style="{ width: progressPercent + '%' }"
      />
      <div
        class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        :style="{ left: `calc(${progressPercent}% - 6px)` }"
      />
    </div>

    <div class="container mx-auto px-4">
      <div class="flex items-center gap-3 h-18">
        <!-- Song Info (left) -->
        <div class="flex items-center gap-3 min-w-0 w-1/3">
          <div class="avatar shrink-0">
            <div class="w-12 h-12 rounded-lg">
              <img
                v-if="currentSong.info?.artworkUrl"
                :src="currentSong.info.artworkUrl"
                :alt="currentSong.info?.title"
                class="object-cover"
              />
              <div
                v-else
                class="bg-base-200 w-full h-full flex items-center justify-center"
              >
                <Icon name="ic:round-library-music" size="1.5rem" />
              </div>
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="font-semibold text-sm truncate">
              {{ currentSong.info?.title || "No song selected" }}
            </div>
            <div class="text-xs opacity-70 truncate">
              {{ currentSong.info?.author || "Unknown artist" }}
            </div>
          </div>
          <a
            v-if="currentSong.info?.uri"
            :href="currentSong.info.uri"
            target="_blank"
            class="btn btn-ghost btn-xs btn-circle shrink-0"
            title="Open in source"
          >
            <Icon name="ic:round-open-in-new" size="1rem" />
          </a>
        </div>

        <!-- Playback Controls (center) -->
        <div class="flex flex-col items-center justify-center flex-1">
          <div class="flex items-center gap-1">
            <button
              class="btn btn-ghost btn-sm btn-circle"
              :class="{ 'text-primary': shuffle }"
              @click="toggleShuffle"
              title="Shuffle"
            >
              <Icon name="ic:round-shuffle" size="1.2rem" />
            </button>

            <button
              class="btn btn-ghost btn-sm btn-circle"
              :disabled="queue.length === 0"
              @click="previous"
              title="Previous"
            >
              <Icon name="ic:round-skip-previous" size="1.5rem" />
            </button>

            <button
              class="btn btn-primary btn-sm btn-circle"
              :disabled="!currentSong"
              @click="togglePlay"
              title="Play/Pause"
            >
              <span
                v-if="isLoading"
                class="loading loading-spinner loading-xs"
              ></span>
              <Icon v-else-if="isPlaying" name="ic:round-pause" size="1.5rem" />
              <Icon v-else name="ic:round-play-arrow" size="1.5rem" />
            </button>

            <button
              class="btn btn-ghost btn-sm btn-circle"
              :disabled="queue.length === 0"
              @click="next"
              title="Next"
            >
              <Icon name="ic:round-skip-next" size="1.5rem" />
            </button>

            <button
              class="btn btn-ghost btn-sm btn-circle"
              :class="{
                'text-primary': repeat === 'all',
                'text-secondary': repeat === 'one',
              }"
              @click="cycleRepeat"
              :title="
                repeat === 'off'
                  ? 'Repeat off'
                  : repeat === 'all'
                    ? 'Repeat all'
                    : 'Repeat one'
              "
            >
              <Icon
                v-if="repeat === 'one'"
                name="ic:round-repeat-one"
                size="1.2rem"
              />
              <Icon v-else name="ic:round-repeat" size="1.2rem" />
            </button>
          </div>

          <!-- Time display -->
          <div class="flex items-center gap-2 text-xs opacity-70">
            <span>{{ formatTime(currentTime) }}</span>
            <span>/</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- Volume & Queue (right) -->
        <div class="flex items-center gap-2 w-1/3 justify-end">
          <!-- Volume -->
          <div class="hidden sm:flex items-center gap-2">
            <button class="btn btn-ghost btn-xs btn-circle" @click="toggleMute">
              <Icon
                :name="
                  volume === 0
                    ? 'ic:round-volume-off'
                    : volume < 50
                      ? 'ic:round-volume-down'
                      : 'ic:round-volume-up'
                "
                size="1.2rem"
              />
            </button>
            <input
              :value="volume"
              type="range"
              min="0"
              max="100"
              class="range range-xs range-primary w-24"
              @input="onVolumeChange"
            />
          </div>

          <!-- Queue toggle -->
          <button
            class="btn btn-ghost btn-sm btn-circle"
            :class="{ 'text-primary': showQueue }"
            @click="showQueue = !showQueue"
            title="Queue"
          >
            <Icon name="ic:round-queue-music" size="1.2rem" />
            <span
              v-if="queue.length > 0"
              class="absolute -top-1 -right-1 badge badge-primary badge-xs"
            >
              {{ queue.length }}
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- Queue Panel (slides up) -->
    <Transition name="slide-up">
      <div
        v-if="showQueue"
        class="absolute bottom-full left-0 right-0 bg-base-200 border-t border-base-content/10 shadow-xl max-h-80 overflow-hidden flex flex-col"
      >
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-base-content/10"
        >
          <h3 class="font-bold text-sm">Queue ({{ queue.length }})</h3>
          <button
            v-if="queue.length > 0"
            class="btn btn-ghost btn-xs"
            @click="clearQueue"
          >
            Clear all
          </button>
        </div>
        <div class="overflow-y-auto flex-1">
          <div
            v-for="(item, index) in queue"
            :key="(item.song.encoded || '') + '-' + index"
            class="flex items-center gap-3 px-4 py-2 hover:bg-base-300 cursor-pointer transition-colors"
            :class="{
              'bg-primary/10 border-l-2 border-primary': index === currentIndex,
            }"
            @click="jumpToIndex(index)"
          >
            <div class="text-xs opacity-50 w-6 text-center shrink-0">
              <Icon
                v-if="index === currentIndex && isPlaying"
                name="ic:round-graphic-eq"
                size="1rem"
                class="text-primary"
              />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <div class="avatar shrink-0">
              <div class="w-8 h-8 rounded">
                <img
                  v-if="item.song.info?.artworkUrl"
                  :src="item.song.info.artworkUrl"
                  :alt="item.song.info?.title"
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
              <div class="text-xs font-semibold truncate">
                {{ item.song.info?.title || "Unknown" }}
              </div>
              <div class="text-xs opacity-70 truncate">
                {{ item.song.info?.author || "Unknown artist" }}
                <span v-if="item.itemName" class="opacity-50">
                  · {{ item.itemName }}
                </span>
              </div>
            </div>
            <div class="text-xs opacity-50 shrink-0">
              {{ formatTime((item.song.info?.length || 0) / 1000) }}
            </div>
            <button
              class="btn btn-ghost btn-xs btn-circle shrink-0"
              @click.stop="removeFromQueue(index)"
            >
              <Icon name="ic:round-close" size="0.875rem" />
            </button>
          </div>

          <div
            v-if="queue.length === 0"
            class="text-center py-8 opacity-50 text-sm"
          >
            Queue is empty
          </div>
        </div>
      </div>
    </Transition>

    <!-- Hidden YouTube IFrame player -->
    <div class="hidden">
      <div ref="ytPlayerContainer" id="yt-player-container"></div>
    </div>

    <!-- Hidden audio element for non-YouTube sources -->
    <audio
      ref="audioElement"
      @timeupdate="onAudioTimeUpdate"
      @loadedmetadata="onAudioMetadataLoaded"
      @ended="onTrackEnd"
      @play="onAudioPlay"
      @pause="onAudioPause"
      @error="onAudioError"
    />
  </div>

  <!-- Spacer to prevent content from being hidden behind player bar -->
  <div v-if="currentSong" class="h-18.5"></div>
</template>

<script setup>
const {
  queue,
  currentIndex,
  isPlaying,
  currentTime,
  duration,
  volume,
  isLoading,
  shuffle,
  repeat,
  currentSong,
  togglePlay,
  next,
  previous,
  onTrackEnd,
  removeFromQueue,
  clearQueue,
  toggleShuffle,
  cycleRepeat,
  formatTime,
  setVolume,
  seekTo,
  playMultiple,
} = usePlayerStore();

const showQueue = ref(false);
const audioElement = ref(null);
const ytPlayerContainer = ref(null);
const previousVolume = ref(70);
const isDragging = ref(false);

let ytPlayer = null;
let ytApiLoaded = false;
let ytApiLoading = false;
let currentSourceType = ref("none"); // "youtube" | "soundcloud" | "audio" | "none"
let ytProgressInterval = null;

// Computed
const progressPercent = computed(() => {
  if (!duration.value || duration.value <= 0) return 0;
  return Math.min((currentTime.value / duration.value) * 100, 100);
});

// Load YouTube IFrame API
function loadYouTubeApi() {
  return new Promise((resolve) => {
    if (ytApiLoaded) {
      resolve();
      return;
    }
    if (ytApiLoading) {
      // Wait for existing load
      const check = setInterval(() => {
        if (ytApiLoaded) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      return;
    }

    ytApiLoading = true;

    // Set up the callback
    window.onYouTubeIframeAPIReady = () => {
      ytApiLoaded = true;
      ytApiLoading = false;
      resolve();
    };

    // Load the script
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

function createYouTubePlayer(videoId) {
  return new Promise((resolve) => {
    // Destroy existing player
    if (ytPlayer) {
      try {
        ytPlayer.destroy();
      } catch {
        // ignore
      }
      ytPlayer = null;
    }

    // Make sure the container element exists and has a child for the player
    const container = ytPlayerContainer.value;
    if (!container) {
      resolve(null);
      return;
    }

    // Create a new div for the player
    container.innerHTML = '<div id="yt-player-element"></div>';

    ytPlayer = new window.YT.Player("yt-player-element", {
      height: "1",
      width: "1",
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onReady: (event) => {
          event.target.setVolume(volume.value);
          resolve(event.target);
        },
        onStateChange: (event) => {
          onYtStateChange(event);
        },
        onError: (event) => {
          console.error("[YT Player] Error:", event.data);
          isLoading.value = false;
          // Try next track on error
          onTrackEnd();
        },
      },
    });
  });
}

function onYtStateChange(event) {
  const YT = window.YT;
  if (!YT) return;

  switch (event.data) {
    case YT.PlayerState.PLAYING:
      isPlaying.value = true;
      isLoading.value = false;
      duration.value = ytPlayer?.getDuration?.() || 0;
      startYtProgressTracking();
      break;
    case YT.PlayerState.PAUSED:
      isPlaying.value = false;
      stopYtProgressTracking();
      break;
    case YT.PlayerState.ENDED:
      stopYtProgressTracking();
      onTrackEnd();
      break;
    case YT.PlayerState.BUFFERING:
      isLoading.value = true;
      break;
  }
}

function startYtProgressTracking() {
  stopYtProgressTracking();
  ytProgressInterval = setInterval(() => {
    if (ytPlayer?.getCurrentTime) {
      currentTime.value = ytPlayer.getCurrentTime();
    }
    if (ytPlayer?.getDuration && duration.value <= 0) {
      const d = ytPlayer.getDuration();
      if (d > 0) duration.value = d;
    }
  }, 250);
}

function stopYtProgressTracking() {
  if (ytProgressInterval) {
    clearInterval(ytProgressInterval);
    ytProgressInterval = null;
  }
}

function extractYouTubeId(uri) {
  if (!uri) return null;
  // Match various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = uri.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Play a track based on its source
async function playTrack(song) {
  if (!song) return;

  isLoading.value = true;
  currentTime.value = 0;
  duration.value = (song.info?.length || 0) / 1000;

  // Stop any currently playing source
  stopAllPlayback();

  const sourceName = song.info?.sourceName || "";
  const uri = song.info?.uri || "";
  const identifier = song.info?.identifier || "";

  // Determine source type
  if (
    sourceName === "youtube" ||
    sourceName === "youtubemusic" ||
    uri.includes("youtube.com") ||
    uri.includes("youtu.be") ||
    uri.includes("music.youtube.com")
  ) {
    // YouTube source - use IFrame API
    currentSourceType.value = "youtube";

    const videoId =
      extractYouTubeId(uri) || extractYouTubeId(identifier) || identifier;

    if (!videoId) {
      console.error("[Player] Could not extract YouTube video ID from:", uri);
      isLoading.value = false;
      onTrackEnd();
      return;
    }

    try {
      await loadYouTubeApi();
      const player = await createYouTubePlayer(videoId);
      if (player) {
        player.setVolume(volume.value);
      }
    } catch (error) {
      console.error("[Player] YouTube player error:", error);
      isLoading.value = false;
      onTrackEnd();
    }
  } else if (sourceName === "soundcloud") {
    // SoundCloud - try direct URI in audio element
    currentSourceType.value = "audio";
    if (audioElement.value && uri) {
      audioElement.value.src = uri;
      audioElement.value.volume = volume.value / 100;
      audioElement.value.load();
      try {
        await audioElement.value.play();
      } catch (error) {
        console.warn("[Player] SoundCloud playback failed:", error);
        isLoading.value = false;
      }
    }
  } else {
    // Other sources - try direct audio
    currentSourceType.value = "audio";
    if (audioElement.value && uri) {
      audioElement.value.src = uri;
      audioElement.value.volume = volume.value / 100;
      audioElement.value.load();
      try {
        await audioElement.value.play();
      } catch (error) {
        console.warn("[Player] Audio playback failed:", error);
        isLoading.value = false;
      }
    } else {
      isLoading.value = false;
    }
  }
}

function stopAllPlayback() {
  // Stop YouTube
  stopYtProgressTracking();
  if (ytPlayer) {
    try {
      ytPlayer.stopVideo();
    } catch {
      // ignore
    }
  }

  // Stop audio element
  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value.src = "";
  }
}

// Audio element handlers
function onAudioTimeUpdate() {
  if (audioElement.value && !isDragging.value) {
    currentTime.value = audioElement.value.currentTime;
  }
}

function onAudioMetadataLoaded() {
  if (audioElement.value) {
    duration.value = audioElement.value.duration;
  }
}

function onAudioPlay() {
  isPlaying.value = true;
  isLoading.value = false;
}

function onAudioPause() {
  if (currentSourceType.value === "audio") {
    isPlaying.value = false;
  }
}

function onAudioError() {
  console.warn("[Player] Audio element error");
  isLoading.value = false;
}

// UI handlers
function onProgressClick(event) {
  if (!duration.value) return;
  const rect = event.currentTarget.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  const seekTime = percent * duration.value;
  performSeek(seekTime);
}

function startDrag(event) {
  isDragging.value = true;

  function onMouseMove(e) {
    const bar = event.currentTarget;
    if (!bar || !duration.value) return;
    const rect = bar.getBoundingClientRect();
    const percent = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    currentTime.value = percent * duration.value;
  }

  function onMouseUp(e) {
    isDragging.value = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
    // Perform the actual seek
    if (duration.value) {
      const bar = event.currentTarget;
      if (bar) {
        const rect = bar.getBoundingClientRect();
        const percent = Math.max(
          0,
          Math.min(1, (e.clientX - rect.left) / rect.width),
        );
        performSeek(percent * duration.value);
      }
    }
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseup", onMouseUp);
}

function performSeek(time) {
  seekTo(time);

  if (currentSourceType.value === "youtube" && ytPlayer?.seekTo) {
    ytPlayer.seekTo(time, true);
  } else if (currentSourceType.value === "audio" && audioElement.value) {
    audioElement.value.currentTime = time;
  }
}

function onVolumeChange(event) {
  setVolume(parseInt(event.target.value));
}

function toggleMute() {
  if (volume.value > 0) {
    previousVolume.value = volume.value;
    setVolume(0);
  } else {
    setVolume(previousVolume.value || 70);
  }
}

function jumpToIndex(index) {
  currentIndex.value = index;
  isPlaying.value = true;
}

// Watch for song changes
watch(currentSong, (newSong) => {
  if (newSong) {
    playTrack(newSong);
  } else {
    stopAllPlayback();
  }
});

// Watch play/pause state changes (from external togglePlay calls)
watch(isPlaying, (playing) => {
  if (currentSourceType.value === "youtube" && ytPlayer) {
    try {
      if (playing) {
        ytPlayer.playVideo();
      } else {
        ytPlayer.pauseVideo();
      }
    } catch {
      // ignore
    }
  } else if (currentSourceType.value === "audio" && audioElement.value) {
    if (playing) {
      audioElement.value.play().catch(() => {});
    } else {
      audioElement.value.pause();
    }
  }
});

// Watch volume changes
watch(volume, (newVolume) => {
  if (currentSourceType.value === "youtube" && ytPlayer?.setVolume) {
    ytPlayer.setVolume(newVolume);
  }
  if (audioElement.value) {
    audioElement.value.volume = newVolume / 100;
  }
});

// Watch for seekTo changes (when previous() resets time)
watch(
  () => currentTime.value,
  (newTime) => {
    // This is handled by performSeek for user interactions
    // For programmatic resets (like repeat one), we need to handle it
    if (newTime === 0 && isPlaying.value) {
      if (currentSourceType.value === "youtube" && ytPlayer?.seekTo) {
        ytPlayer.seekTo(0, true);
      } else if (currentSourceType.value === "audio" && audioElement.value) {
        audioElement.value.currentTime = 0;
      }
    }
  },
);

// Cleanup on unmount
onBeforeUnmount(() => {
  stopAllPlayback();
  stopYtProgressTracking();
  if (ytPlayer) {
    try {
      ytPlayer.destroy();
    } catch {
      // ignore
    }
  }
});
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
