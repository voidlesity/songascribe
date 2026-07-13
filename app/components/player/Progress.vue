<template>
  <div
    class="relative h-1.25 bg-base-300 cursor-pointer group focus-within:ring-2 focus-within:ring-primary focus-within:ring-inset"
  >
    <div
      class="absolute inset-y-0 left-0 bg-primary pointer-events-none"
      :style="{ width: `${progressPercent}%` }"
    />
    <div
      class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none"
      :style="{ left: `calc(${progressPercent}% - 6px)` }"
    />
    <input
      :value="displayTime"
      type="range"
      min="0"
      :max="safeDuration"
      step="0.1"
      class="absolute -top-1.5 left-0 w-full h-4 opacity-0 cursor-pointer"
      aria-label="Playback position"
      :aria-valuetext="`${formatTime(displayTime)} of ${formatTime(safeDuration)}`"
      :disabled="safeDuration <= 0"
      @pointerdown="isInteracting = true"
      @pointercancel="cancelInteraction"
      @input="preview"
      @change="commit"
      @blur="finishInteraction"
    >
  </div>
</template>

<script setup lang="ts">
import { formatTime } from "~/utils/time";

const props = defineProps<{
  currentTime: number;
  duration: number;
}>();

const emit = defineEmits<{
  seek: [time: number];
}>();

const isInteracting = ref(false);
const draftTime = ref(0);

const safeDuration = computed(() =>
  Number.isFinite(props.duration) && props.duration > 0 ? props.duration : 0,
);
const clampedCurrentTime = computed(() =>
  Math.max(0, Math.min(props.currentTime, safeDuration.value)),
);
const displayTime = computed(() =>
  isInteracting.value ? draftTime.value : clampedCurrentTime.value,
);
const progressPercent = computed(() =>
  safeDuration.value > 0
    ? Math.min((displayTime.value / safeDuration.value) * 100, 100)
    : 0,
);

watch(clampedCurrentTime, (time) => {
  if (!isInteracting.value) draftTime.value = time;
}, { immediate: true });

function eventValue(event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  return Math.max(0, Math.min(value, safeDuration.value));
}

function preview(event: Event) {
  isInteracting.value = true;
  draftTime.value = eventValue(event);
}

function commit(event: Event) {
  draftTime.value = eventValue(event);
  emit("seek", draftTime.value);
  isInteracting.value = false;
}

function finishInteraction() {
  isInteracting.value = false;
}

function cancelInteraction() {
  draftTime.value = clampedCurrentTime.value;
  isInteracting.value = false;
}
</script>
