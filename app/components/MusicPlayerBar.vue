<template>
  <div
    v-if="currentSong"
    class="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 bg-base-100 border-t border-base-300"
  >
    <PlayerProgress
      :current-time="currentTime"
      :duration="duration"
      @seek="performSeek"
    />

    <div class="px-3 py-2 flex items-center gap-3">
      <PlayerCurrentTrack :song="currentSong" />

      <PlayerControls
        :is-playing="isPlaying"
        :is-loading="isLoading"
        :shuffle="shuffle"
        :repeat="repeat"
        :has-queue="queue.length > 0"
        :current-time="displayTime"
        :duration="duration"
        @toggle-shuffle="toggleShuffle"
        @previous="handlePrevious"
        @toggle-play="togglePlay"
        @next="next"
        @cycle-repeat="cycleRepeat"
      />

      <div class="hidden md:flex items-center gap-2 w-1/3 justify-end">
        <PlayerVolume :volume="volume" @change="setVolume" />
        <PlayerQueueButton
          :count="queue.length"
          :open="showQueue"
          @toggle="showQueue = !showQueue"
        />
      </div>

      <PlayerQueueButton
        class="md:hidden"
        :count="queue.length"
        :open="showQueue"
        @toggle="showQueue = !showQueue"
      />
    </div>

    <PlayerPlaybackError
      v-if="playbackError"
      :message="playbackError"
      @retry="retry"
    />

    <PlayerQueuePanel
      :open="showQueue"
      :queue="queue"
      :current-index="currentIndex"
      :is-playing="isPlaying"
      @clear="clearQueue"
      @jump="jumpToIndex"
      @remove="removeFromQueue"
    />
  </div>
</template>

<script setup lang="ts">
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
  currentQueueItem,
  currentSong,
  togglePlay,
  next,
  previous,
  onTrackEnd,
  removeFromQueue,
  clearQueue,
  toggleShuffle,
  cycleRepeat,
  setVolume,
  seekTo,
} = usePlayerStore();

const showQueue = ref(false);
const displayTime = computed(() =>
  duration.value > 0
    ? Math.min(currentTime.value, duration.value)
    : currentTime.value,
);

const { playbackError, seek, retry } = usePcmPlayback({
  currentQueueItem,
  isPlaying,
  currentTime,
  duration,
  volume,
  isLoading,
  onTrackEnd,
});

function performSeek(time: number) {
  seekTo(time);
  seek(time);
}

function handlePrevious() {
  const shouldRestartCurrent = currentTime.value > 3;
  previous();
  if (shouldRestartCurrent) seek(0);
}

function jumpToIndex(index: number) {
  currentIndex.value = index;
  isPlaying.value = true;
}
</script>
