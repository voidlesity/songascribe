<template>
  <div
    v-if="currentSong"
    class="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-base-100"
  >
    <div
      class="relative h-1.25 bg-base-300 cursor-pointer group"
      @click="onProgressClick"
      @mousedown="startDrag"
    >
      <div
        class="absolute inset-y-0 left-0 bg-primary"
        :style="{ width: progressPercent + '%' }"
      />
      <div
        class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100"
        :style="{ left: `calc(${progressPercent}% - 6px)` }"
      />
    </div>

    <div class="px-3 py-2 flex items-center gap-3">
      <div class="flex items-center gap-2 min-w-0 flex-1 md:w-1/3 md:flex-none">
        <TrackArt
          :artwork-url="currentSong.artworkUrl"
          :title="currentSong.title"
          size="sm"
        />
        <div class="min-w-0 flex-1">
          <div class="font-medium text-sm truncate">
            {{ currentSong.title || "Nothing playing" }}
          </div>
          <div class="text-xs opacity-60 truncate">
            {{ currentSong.author || "Unknown" }}
          </div>
        </div>
        <a
          v-if="currentSong.uri"
          :href="currentSong.uri"
          target="_blank"
          class="btn btn-ghost btn-xs btn-square hidden sm:inline-flex"
          title="Open source"
        >
          <Icon name="mdi:open-in-new" />
        </a>
      </div>

      <div class="flex flex-col items-center gap-0.5 md:flex-1">
        <div class="flex items-center gap-1">
          <button
            class="btn btn-ghost btn-xs btn-square hidden sm:inline-flex"
            :class="{ 'text-primary': shuffle }"
            title="Shuffle"
            @click="toggleShuffle"
          >
            <Icon name="mdi:shuffle" />
          </button>
          <button
            class="btn btn-ghost btn-sm btn-square"
            :disabled="queue.length === 0"
            @click="previous"
          >
            <Icon name="mdi:skip-previous" size="1.25rem" />
          </button>
          <button
            class="btn btn-primary btn-sm btn-circle"
            :disabled="!currentSong"
            @click="togglePlay"
          >
            <span v-if="isLoading" class="loading loading-spinner loading-xs" />
            <Icon v-else-if="isPlaying" name="mdi:pause" size="1.25rem" />
            <Icon v-else name="mdi:play" size="1.25rem" />
          </button>
          <button
            class="btn btn-ghost btn-sm btn-square"
            :disabled="queue.length === 0"
            @click="next"
          >
            <Icon name="mdi:skip-next" size="1.25rem" />
          </button>
          <button
            class="btn btn-ghost btn-xs btn-square hidden sm:inline-flex"
            :class="{
              'text-primary': repeat === 'all',
              'text-secondary': repeat === 'one',
            }"
            @click="cycleRepeat"
          >
            <Icon :name="repeat === 'one' ? 'mdi:repeat-once' : 'mdi:repeat'" />
          </button>
        </div>
        <div
          class="hidden sm:flex items-center gap-1.5 text-[10px] opacity-60 tabular-nums"
        >
          <span>{{ formatTime(displayTime) }}</span>
          <span>/</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>

      <div class="hidden md:flex items-center gap-2 w-1/3 justify-end">
        <button class="btn btn-ghost btn-xs btn-square" @click="toggleMute">
          <Icon
            :name="
              volume === 0
                ? 'mdi:volume-off'
                : volume < 50
                  ? 'mdi:volume-medium'
                  : 'mdi:volume-high'
            "
          />
        </button>
        <input
          :value="volume"
          type="range"
          min="0"
          max="100"
          class="range range-xs range-primary w-24"
          @input="onVolumeChange"
        >
        <button
          class="btn btn-ghost btn-sm btn-square relative"
          :class="{ 'text-primary': showQueue }"
          @click="showQueue = !showQueue"
        >
          <Icon name="mdi:playlist-music" />
          <span
            v-if="queue.length > 0"
            class="badge badge-primary badge-xs absolute -top-0.5 -right-0.5"
          >
            {{ queue.length }}
          </span>
        </button>
      </div>

      <button
        class="md:hidden btn btn-ghost btn-sm btn-square relative"
        :class="{ 'text-primary': showQueue }"
        @click="showQueue = !showQueue"
      >
        <Icon name="mdi:playlist-music" />
        <span
          v-if="queue.length > 0"
          class="badge badge-primary badge-xs absolute -top-0.5 -right-0.5"
        >
          {{ queue.length }}
        </span>
      </button>
    </div>

    <Transition name="slide-up">
      <div
        v-if="showQueue"
        class="absolute bottom-full left-0 right-0 bg-base-100 border-t border-base-300 shadow-xl max-h-80 flex flex-col"
      >
        <div
          class="flex items-center justify-between px-3 py-2 border-b border-base-300"
        >
          <h3 class="font-semibold text-sm">Queue ({{ queue.length }})</h3>
          <button
            v-if="queue.length > 0"
            class="btn btn-ghost btn-xs"
            @click="clearQueue"
          >
            Clear
          </button>
        </div>
        <ul class="list overflow-y-auto flex-1">
          <li
            v-for="(item, index) in queue"
            :key="(item.song.encoded || '') + '-' + index"
            class="list-row cursor-pointer hover:bg-base-200"
            :class="{ 'bg-primary/10': index === currentIndex }"
            @click="jumpToIndex(index)"
          >
            <div class="text-xs opacity-50 w-5 text-center">
              <Icon
                v-if="index === currentIndex && isPlaying"
                name="mdi:equalizer"
                class="text-primary"
              />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <TrackArt
              :artwork-url="item.song.artworkUrl"
              :title="item.song.title"
              size="sm"
            />
            <div class="list-col-grow min-w-0">
              <div class="text-sm font-medium truncate">
                {{ item.song.title || "Unknown" }}
              </div>
              <div class="text-xs opacity-60 truncate">
                {{ item.song.author || "Unknown" }}
                <span v-if="item.itemName" class="opacity-50">
                  · {{ item.itemName }}
                </span>
              </div>
            </div>
            <span class="text-xs opacity-50 tabular-nums">
              {{ formatTime((item.song.lengthMs || 0) / 1000) }}
            </span>
            <button
              class="btn btn-ghost btn-xs btn-square"
              @click.stop="removeFromQueue(index)"
            >
              <Icon name="mdi:close" />
            </button>
          </li>
          <li
            v-if="queue.length === 0"
            class="text-center py-6 opacity-50 text-sm"
          >
            Queue is empty
          </li>
        </ul>
      </div>
    </Transition>
  </div>
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
} = usePlayerStore();

const showQueue = ref(false);
const previousVolume = ref(70);
const isDragging = ref(false);

let audioContext = null;
let workletNode = null;
let gainNode = null;
let workletReadyPromise = null;
let currentAbortController = null;
let activeTrackToken = 0; // monotonically increasing; older fetches check it
let initialPositionSec = 0; // start offset of the current stream
let bufferedSamples = 0;

const SAMPLE_RATE = 48000;
const CHANNELS = 2;
const BACKPRESSURE_SAMPLES = SAMPLE_RATE * CHANNELS * 8; // ~8 s of audio buffered
const BACKPRESSURE_RESUME = SAMPLE_RATE * CHANNELS * 4;

// Computed
const progressPercent = computed(() => {
  if (!duration.value || duration.value <= 0) return 0;
  return Math.min((currentTime.value / duration.value) * 100, 100);
});

// Displayed time is clamped to the track length so a looping/seeking track
// never shows a value past the total duration.
const displayTime = computed(() =>
  duration.value > 0
    ? Math.min(currentTime.value, duration.value)
    : currentTime.value,
);

let suppressTimeWatch = false;

async function ensureAudioGraph() {
  if (audioContext && workletNode && gainNode) return;

  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    audioContext = new Ctx({ sampleRate: SAMPLE_RATE });
  }
  if (!workletReadyPromise) {
    workletReadyPromise = audioContext.audioWorklet.addModule(
      "/pcm-player-worklet.js",
    );
  }
  await workletReadyPromise;

  if (!workletNode) {
    workletNode = new AudioWorkletNode(audioContext, "pcm-player-processor", {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [CHANNELS],
    });
    workletNode.port.onmessage = onWorkletMessage;
  }
  if (!gainNode) {
    gainNode = audioContext.createGain();
    gainNode.gain.value = volume.value / 100;
    workletNode.connect(gainNode).connect(audioContext.destination);
  }
}

function onWorkletMessage(event) {
  const msg = event.data;
  if (!msg) return;
  if (msg.type === "status") {
    bufferedSamples = msg.bufferedSamples;
    if (!isDragging.value) {
      currentTime.value = initialPositionSec + msg.framesPlayed / SAMPLE_RATE;
    }
  } else if (msg.type === "ended") {
    if (repeat.value === "one" && currentSong.value) {
      currentTime.value = 0;
      performSeek(0);
    } else {
      onTrackEnd();
    }
  }
}

function flushWorklet() {
  if (workletNode) {
    workletNode.port.postMessage({ type: "flush" });
  }
  bufferedSamples = 0;
}

function abortCurrentStream() {
  if (currentAbortController) {
    try {
      currentAbortController.abort();
    } catch {
      // ignore
    }
    currentAbortController = null;
  }
}

async function streamPcm(encodedTrack, positionMs, token) {
  const controller = new AbortController();
  currentAbortController = controller;

  let response;
  try {
    response = await fetch(
      `/api/audio/stream?encoded=${encodeURIComponent(encodedTrack)}&position=${positionMs}`,
      { signal: controller.signal },
    );
  } catch (err) {
    if (controller.signal.aborted) return;
    console.error("[PCM] fetch failed:", err);
    if (token === activeTrackToken) {
      isLoading.value = false;
      onTrackEnd();
    }
    return;
  }

  if (!response.ok || !response.body) {
    console.error("[PCM] upstream status", response.status);
    if (token === activeTrackToken) {
      isLoading.value = false;
      onTrackEnd();
    }
    return;
  }

  const reader = response.body.getReader();
  let leftover = null; // Uint8Array containing a single dangling byte, if any

  try {
    while (true) {
      if (token !== activeTrackToken) {
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        return;
      }

      // Backpressure: wait until the worklet drains a bit.
      while (
        bufferedSamples > BACKPRESSURE_SAMPLES &&
        token === activeTrackToken &&
        !controller.signal.aborted
      ) {
        await new Promise((r) => setTimeout(r, 50));
        if (bufferedSamples <= BACKPRESSURE_RESUME) break;
      }

      const { value, done } = await reader.read();
      if (done) break;
      if (!value || value.length === 0) continue;

      // Stitch any leftover odd byte from the previous chunk.
      let bytes = value;
      if (leftover) {
        const merged = new Uint8Array(leftover.length + value.length);
        merged.set(leftover, 0);
        merged.set(value, leftover.length);
        bytes = merged;
        leftover = null;
      }
      if (bytes.length % 2 !== 0) {
        leftover = bytes.slice(bytes.length - 1);
        bytes = bytes.slice(0, bytes.length - 1);
      }
      if (bytes.length === 0) continue;

      const sampleCount = bytes.length >>> 1;
      const view = new DataView(
        bytes.buffer,
        bytes.byteOffset,
        bytes.byteLength,
      );
      const floats = new Float32Array(sampleCount);
      for (let i = 0; i < sampleCount; i++) {
        floats[i] = view.getInt16(i * 2, true) / 32768;
      }
      bufferedSamples += floats.length;

      if (token !== activeTrackToken) return;
      workletNode.port.postMessage({ type: "samples", data: floats }, [
        floats.buffer,
      ]);

      if (isLoading.value) isLoading.value = false;
    }

    if (token === activeTrackToken) {
      workletNode.port.postMessage({ type: "eos" });
    }
  } catch (err) {
    if (!controller.signal.aborted) {
      console.error("[PCM] stream error:", err);
      if (token === activeTrackToken) {
        isLoading.value = false;
        onTrackEnd();
      }
    }
  } finally {
    if (currentAbortController === controller) {
      currentAbortController = null;
    }
  }
}

async function playTrack(song) {
  if (!song?.encoded) return;

  abortCurrentStream();
  const token = ++activeTrackToken;
  initialPositionSec = 0;

  suppressTimeWatch = true;
  isLoading.value = true;
  currentTime.value = 0;
  duration.value = (song.lengthMs || 0) / 1000;
  // Release the suppression after the watcher has had a chance to run.
  void nextTick().then(() => {
    suppressTimeWatch = false;
  });

  try {
    await ensureAudioGraph();
  } catch (err) {
    console.error("[PCM] audio graph init failed:", err);
    isLoading.value = false;
    return;
  }

  if (token !== activeTrackToken) return;

  flushWorklet();
  workletNode.port.postMessage({ type: "resetPosition" });

  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch {
      // ignore - autoplay policy will resume on next user interaction
    }
  }

  // Kick off the stream; intentionally not awaited so this function returns
  // promptly and `process()` can start consuming as soon as bytes arrive.
  void streamPcm(song.encoded, 0, token);
}

function stopAllPlayback() {
  activeTrackToken++;
  abortCurrentStream();
  flushWorklet();
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
  if (!Number.isFinite(time) || time < 0) return;
  seekTo(time);

  if (!workletNode || !currentSong.value?.encoded) return;

  // Restart the upstream stream at the requested position. NodeLink decodes
  // and resumes from `position` server-side, so we discard everything we
  // already had buffered locally and start fresh.
  abortCurrentStream();
  flushWorklet();
  workletNode.port.postMessage({ type: "resetPosition" });

  const token = ++activeTrackToken;
  initialPositionSec = time;
  isLoading.value = true;

  void streamPcm(currentSong.value.encoded, Math.round(time * 1000), token);
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
watch(isPlaying, async (playing) => {
  if (!audioContext) return;
  try {
    if (playing) {
      if (audioContext.state === "suspended") await audioContext.resume();
    } else if (audioContext.state === "running") {
      await audioContext.suspend();
    }
  } catch (err) {
    console.warn("[PCM] audio context state change failed:", err);
  }
});

// Watch volume changes
watch(volume, (newVolume) => {
  if (gainNode) gainNode.gain.value = Math.max(0, Math.min(1, newVolume / 100));
});

watch(
  () => currentTime.value,
  (newTime) => {
    if (suppressTimeWatch || isDragging.value) return;
    if (newTime !== 0 || !isPlaying.value || !currentSong.value) return;
    if (initialPositionSec > 0.5) {
      performSeek(0);
    }
  },
);

// Cleanup on unmount
onBeforeUnmount(() => {
  stopAllPlayback();
  if (workletNode) {
    try {
      workletNode.disconnect();
    } catch {
      // ignore
    }
    workletNode = null;
  }
  if (gainNode) {
    try {
      gainNode.disconnect();
    } catch {
      // ignore
    }
    gainNode = null;
  }
  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
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
