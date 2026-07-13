<template>
  <UiBaseDialog :open="open" title="Share category" @close="emit('close')">
    <p class="text-sm opacity-70 mb-4">
      Anyone with this link can view this category until it expires or is revoked.
    </p>

    <div v-if="share" class="space-y-4">
      <div class="join w-full">
        <input :value="absoluteUrl" readonly class="input join-item flex-1 min-w-0" @focus="selectInput" />
        <button class="btn btn-primary join-item" type="button" @click="copy">
          <Icon :name="copied ? 'mdi:check' : 'mdi:content-copy'" />
          {{ copied ? "Copied" : "Copy" }}
        </button>
      </div>

      <label class="floating-label">
        <input v-model="expiry" type="datetime-local" class="input w-full" />
        <span>Expires (optional)</span>
      </label>
      <p class="text-xs opacity-60">Leave blank for a link that does not expire.</p>

      <p v-if="error" class="alert alert-error text-sm">{{ error }}</p>
      <p v-if="message" class="alert alert-success text-sm">{{ message }}</p>

      <div class="flex flex-wrap gap-2">
        <button class="btn btn-sm btn-primary" :disabled="busy" @click="saveExpiry">
          <span v-if="busyAction === 'expiry'" class="loading loading-spinner loading-xs" />
          Save expiry
        </button>
        <button class="btn btn-sm btn-outline" :disabled="busy" @click="confirmRotate = true">
          <Icon name="mdi:autorenew" /> Rotate link
        </button>
        <button class="btn btn-sm btn-error btn-outline ml-auto" :disabled="busy" @click="confirmRevoke = true">
          <Icon name="mdi:link-variant-off" /> Revoke
        </button>
      </div>
    </div>

    <div v-else class="flex justify-center py-8">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div class="modal-action">
      <button class="btn btn-ghost" :disabled="busy" @click="emit('close')">Close</button>
    </div>
  </UiBaseDialog>

  <UiConfirmDialog
    :open="confirmRotate"
    title="Rotate share link?"
    message="The current link will stop working immediately and a new link will be created."
    confirm-label="Rotate link"
    :busy="busy"
    :error="error"
    @cancel="confirmRotate = false"
    @confirm="rotate"
  />
  <UiConfirmDialog
    :open="confirmRevoke"
    title="Revoke share link?"
    message="Anyone using the current link will no longer be able to access this category."
    confirm-label="Revoke link"
    danger
    :busy="busy"
    :error="error"
    @cancel="confirmRevoke = false"
    @confirm="revoke"
  />
</template>

<script setup lang="ts">
import type { Share } from "#shared/contracts";
import { getApiErrorMessage } from "~/services/api";
import { catalogApi } from "~/services/catalog";

const props = defineProps<{
  open: boolean;
  categoryId: number | null;
  initialShare?: Share | null;
}>();
const emit = defineEmits<{ close: []; revoked: []; updated: [share: Share] }>();
const requestUrl = useRequestURL();
const share = ref<Share | null>(null);
const expiry = ref("");
const copied = ref(false);
const error = ref("");
const message = ref("");
const busyAction = ref<"expiry" | "rotate" | "revoke" | "">("");
const confirmRotate = ref(false);
const confirmRevoke = ref(false);
const busy = computed(() => !!busyAction.value);
const absoluteUrl = computed(() =>
  share.value ? new URL(share.value.url, requestUrl.origin).toString() : "",
);

watch(
  () => [props.open, props.initialShare] as const,
  ([open, initial]) => {
    if (!open) return;
    share.value = initial ?? null;
    expiry.value = toLocalInput(initial?.expiresAt ?? null);
    copied.value = false;
    error.value = "";
    message.value = "";
  },
  { immediate: true },
);

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function expiryBody() {
  return { expiresAt: expiry.value ? new Date(expiry.value).toISOString() : null };
}

function selectInput(event: FocusEvent) {
  (event.target as HTMLInputElement | null)?.select();
}

async function copy() {
  error.value = "";
  try {
    if (!import.meta.client || !navigator.clipboard) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(absoluteUrl.value);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1500);
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Could not copy the link");
  }
}

async function saveExpiry() {
  if (!props.categoryId) return;
  busyAction.value = "expiry";
  error.value = "";
  message.value = "";
  try {
    share.value = await catalogApi.createShare(props.categoryId, expiryBody());
    expiry.value = toLocalInput(share.value.expiresAt);
    message.value = "Share expiry updated";
    emit("updated", share.value);
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Failed to update share expiry");
  } finally {
    busyAction.value = "";
  }
}

async function rotate() {
  if (!props.categoryId) return;
  busyAction.value = "rotate";
  error.value = "";
  message.value = "";
  try {
    share.value = await catalogApi.rotateShare(props.categoryId, expiryBody());
    expiry.value = toLocalInput(share.value.expiresAt);
    message.value = "Share link rotated";
    confirmRotate.value = false;
    emit("updated", share.value);
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Failed to rotate share link");
  } finally {
    busyAction.value = "";
  }
}

async function revoke() {
  if (!props.categoryId) return;
  busyAction.value = "revoke";
  error.value = "";
  try {
    await catalogApi.revokeShare(props.categoryId);
    share.value = null;
    confirmRevoke.value = false;
    emit("revoked");
    emit("close");
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Failed to revoke share link");
  } finally {
    busyAction.value = "";
  }
}
</script>
