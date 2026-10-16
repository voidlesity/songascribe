<template>
  <dialog :class="['modal', { 'modal-open': open }]">
    <div class="modal-box">
      <h3 class="text-lg font-semibold mb-2">Share category</h3>
      <p class="text-sm opacity-70 mb-4">
        Anyone with this link can view this category.
      </p>

      <div class="join w-full">
        <input
          :value="url"
          readonly
          class="input join-item flex-1"
          @focus="($event.target as HTMLInputElement).select()"
        />
        <button class="btn btn-primary join-item" @click="copy">
          <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" />
          {{ copied ? "Copied" : "Copy" }}
        </button>
      </div>

      <div class="modal-action">
        <button class="btn btn-ghost" @click="emit('close')">Close</button>
      </div>
    </div>
    <form
      method="dialog"
      class="modal-backdrop"
      @submit.prevent="emit('close')"
    >
      <button>close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  open: boolean;
  url: string;
}>();

const emit = defineEmits<{ close: [] }>();

const copied = ref(false);

async function copy() {
  try {
    await navigator.clipboard.writeText(props.url);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1500);
  } catch {
    // ignore
  }
}
</script>
