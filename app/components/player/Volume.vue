<template>
  <div class="flex items-center gap-2">
    <button
      type="button"
      class="btn btn-ghost btn-xs btn-square"
      :title="volume === 0 ? 'Unmute' : 'Mute'"
      :aria-label="volume === 0 ? 'Unmute' : 'Mute'"
      @click="toggleMute"
    >
      <Icon :name="volumeIcon" />
    </button>
    <input
      :value="volume"
      type="range"
      min="0"
      max="100"
      step="1"
      class="range range-xs range-primary w-24"
      aria-label="Volume"
      :aria-valuetext="`${volume}%`"
      @input="changeVolume"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  volume: number;
}>();

const emit = defineEmits<{
  change: [volume: number];
}>();

const previousVolume = ref(70);
const volumeIcon = computed(() =>
  props.volume === 0
    ? "mdi:volume-off"
    : props.volume < 50
      ? "mdi:volume-medium"
      : "mdi:volume-high",
);

watch(
  () => props.volume,
  (volume) => {
    if (volume > 0) previousVolume.value = volume;
  },
);

function changeVolume(event: Event) {
  emit("change", Number((event.target as HTMLInputElement).value));
}

function toggleMute() {
  emit("change", props.volume > 0 ? 0 : previousVolume.value || 70);
}
</script>
