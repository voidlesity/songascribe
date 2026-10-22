<template>
  <UiBaseDialog
    :open="open"
    :title="title"
    size="sm"
    :dismissible="!busy"
    @close="emit('cancel')"
  >
    <p class="text-sm opacity-80">{{ message }}</p>
    <template v-if="confirmation">
      <p class="text-sm opacity-60 mt-4">
        Type <strong>{{ confirmation }}</strong> to confirm.
      </p>
      <input
        v-model="typed"
        type="text"
        class="input w-full mt-2"
        :placeholder="confirmation"
        autocomplete="off"
      />
    </template>
    <p v-if="error" class="alert alert-error text-sm mt-4">{{ error }}</p>
    <div class="modal-action">
      <button class="btn btn-ghost" :disabled="busy" @click="emit('cancel')">
        Cancel
      </button>
      <button
        class="btn"
        :class="danger ? 'btn-error' : 'btn-primary'"
        :disabled="busy || (!!confirmation && typed !== confirmation)"
        @click="emit('confirm')"
      >
        <span v-if="busy" class="loading loading-spinner loading-xs" />
        {{ confirmLabel }}
      </button>
    </div>
  </UiBaseDialog>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmation?: string;
    danger?: boolean;
    busy?: boolean;
    error?: string;
  }>(),
  {
    confirmLabel: "Confirm",
    confirmation: "",
    danger: false,
    busy: false,
    error: "",
  },
);

const emit = defineEmits<{ cancel: []; confirm: [] }>();
const typed = ref("");

watch(
  () => props.open,
  (open) => {
    if (open) typed.value = "";
  },
);
</script>
