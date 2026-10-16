<template>
  <dialog :class="['modal', { 'modal-open': open }]">
    <div class="modal-box max-w-md">
      <h3 class="text-lg font-semibold mb-1">Adjust your photo</h3>
      <p class="text-sm opacity-60 mb-4">Drag to reposition, zoom to scale.</p>

      <div class="flex flex-col items-center gap-4">
        <div
          ref="viewport"
          class="relative overflow-hidden rounded-full bg-base-300 ring-1 ring-base-300 select-none touch-none cursor-grab active:cursor-grabbing"
          :style="{ width: `${VIEWPORT}px`, height: `${VIEWPORT}px` }"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
          @wheel.prevent="onWheel"
        >
          <img
            v-if="src"
            :src="src"
            alt=""
            draggable="false"
            class="absolute top-0 left-0 max-w-none pointer-events-none"
            :style="imgStyle"
            @load="onImageLoad"
          />
          <div
            class="absolute inset-0 rounded-full ring-2 ring-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)] pointer-events-none"
          />
        </div>

        <div class="flex items-center gap-3 w-full max-w-xs">
          <Icon name="mdi:magnify-minus-outline" class="opacity-60" />
          <input
            v-model.number="zoom"
            type="range"
            :min="1"
            :max="4"
            step="0.01"
            class="range range-sm range-primary flex-1"
            @input="onZoomInput"
          />
          <Icon name="mdi:magnify-plus-outline" class="opacity-60" />
        </div>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost" :disabled="busy" @click="emit('cancel')">
          Cancel
        </button>
        <button
          class="btn btn-primary"
          :disabled="busy || !loaded"
          @click="confirm"
        >
          <span v-if="busy" class="loading loading-spinner loading-xs" />
          <Icon v-else name="mdi:check" /> Apply
        </button>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
      @submit.prevent="emit('cancel')"
    >
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  file: File | null;
}>();

const emit = defineEmits<{ cancel: []; confirm: [blob: Blob] }>();

const VIEWPORT = 288;
const OUTPUT = 288;

const src = ref<string | null>(null);
const loaded = ref(false);
const busy = ref(false);

const natW = ref(0);
const natH = ref(0);
const baseScale = ref(1);
const zoom = ref(1);
const tx = ref(0);
const ty = ref(0);

let imgEl: HTMLImageElement | null = null;

const displayScale = computed(() => baseScale.value * zoom.value);

const imgStyle = computed(() => ({
  width: `${natW.value}px`,
  height: `${natH.value}px`,
  transform: `translate(${tx.value}px, ${ty.value}px) scale(${displayScale.value})`,
  transformOrigin: "0 0",
}));

watch(
  () => props.file,
  (file) => {
    if (src.value) URL.revokeObjectURL(src.value);
    loaded.value = false;
    if (file) {
      src.value = URL.createObjectURL(file);
    } else {
      src.value = null;
    }
  },
);

onBeforeUnmount(() => {
  if (src.value) URL.revokeObjectURL(src.value);
});

function clamp() {
  const dw = natW.value * displayScale.value;
  const dh = natH.value * displayScale.value;
  tx.value = Math.min(0, Math.max(VIEWPORT - dw, tx.value));
  ty.value = Math.min(0, Math.max(VIEWPORT - dh, ty.value));
}

function onImageLoad(e: Event) {
  imgEl = e.target as HTMLImageElement;
  natW.value = imgEl.naturalWidth;
  natH.value = imgEl.naturalHeight;
  baseScale.value = VIEWPORT / Math.min(natW.value, natH.value);
  zoom.value = 1;
  tx.value = (VIEWPORT - natW.value * displayScale.value) / 2;
  ty.value = (VIEWPORT - natH.value * displayScale.value) / 2;
  clamp();
  loaded.value = true;
}

function onZoomInput() {
  // Keep the viewport centre anchored while zooming.
  const prevScale = natW.value === 0 ? 1 : displayScale.value;
  const centreImgX = (VIEWPORT / 2 - tx.value) / prevScale;
  const centreImgY = (VIEWPORT / 2 - ty.value) / prevScale;
  const newScale = displayScale.value;
  tx.value = VIEWPORT / 2 - centreImgX * newScale;
  ty.value = VIEWPORT / 2 - centreImgY * newScale;
  clamp();
}

function onWheel(e: WheelEvent) {
  const next = zoom.value - e.deltaY * 0.001;
  zoom.value = Math.min(4, Math.max(1, next));
  onZoomInput();
}

let dragging = false;
let lastX = 0;
let lastY = 0;

function onPointerDown(e: PointerEvent) {
  if (!loaded.value) return;
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
  if (!dragging) return;
  tx.value += e.clientX - lastX;
  ty.value += e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  clamp();
}

function onPointerUp(e: PointerEvent) {
  dragging = false;
  try {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  } catch {
    // ignore
  }
}

function confirm() {
  if (!imgEl || !loaded.value) return;
  busy.value = true;

  const k = OUTPUT / VIEWPORT;
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT;
  canvas.height = OUTPUT;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    busy.value = false;
    return;
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    imgEl,
    0,
    0,
    natW.value,
    natH.value,
    tx.value * k,
    ty.value * k,
    natW.value * displayScale.value * k,
    natH.value * displayScale.value * k,
  );

  canvas.toBlob(
    (blob) => {
      busy.value = false;
      if (blob) emit("confirm", blob);
    },
    "image/webp",
    0.9,
  );
}
</script>
