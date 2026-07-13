<template>
  <div class="space-y-5">
    <div>
      <h2 class="font-semibold">Profile</h2>
      <p class="text-sm opacity-60">Upload a picture to personalize your account.</p>
    </div>

    <div class="flex flex-col sm:flex-row items-center gap-6">
      <button
        type="button"
        class="group relative shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="{ 'ring-2 ring-primary': dragging }"
        aria-label="Upload avatar"
        @click="fileInput?.click()"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <div class="avatar">
          <div class="w-28 rounded-full bg-base-300 ring-1 ring-base-300">
            <img v-if="avatar" :src="avatar" :alt="username" />
            <div v-else class="w-full h-full flex items-center justify-center opacity-40"><Icon name="mdi:account" size="3rem" /></div>
          </div>
        </div>
        <div class="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center gap-1 opacity-0 transition group-hover:opacity-100" :class="{ 'opacity-100': dragging }">
          <Icon name="mdi:camera-plus-outline" size="1.5rem" /><span class="text-xs font-medium">Change</span>
        </div>
        <div v-if="uploading" class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
          <span class="loading loading-spinner text-white" />
        </div>
      </button>

      <div class="flex-1 text-center sm:text-left space-y-2">
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
        <div class="flex flex-wrap justify-center sm:justify-start gap-2">
          <button type="button" class="btn btn-sm btn-outline" :disabled="uploading" @click="fileInput?.click()">
            <Icon name="mdi:upload" /> Upload image
          </button>
          <button v-if="avatar" type="button" class="btn btn-sm btn-ghost text-error" :disabled="uploading" @click="clearAvatar">
            <Icon name="mdi:delete-outline" /> Remove
          </button>
        </div>
        <p class="text-xs opacity-50">Drag &amp; drop or click. JPG, PNG or WebP, up to 2 MB.</p>
        <p v-if="message" class="text-success text-xs"><Icon name="mdi:check-circle" /> {{ message }}</p>
        <p v-if="error" class="alert alert-error text-xs">{{ error }}</p>
      </div>
    </div>

    <div class="divider" />
    <div>
      <h2 class="font-semibold text-error mb-1">Danger zone</h2>
      <p class="text-sm opacity-60 mb-3">Permanently delete your account and all associated data. This cannot be undone.</p>
      <button class="btn btn-error btn-outline btn-sm" @click="confirmDelete = true">
        <Icon name="mdi:delete-forever" /> Delete account
      </button>
    </div>

    <SettingsAvatarCropper :open="cropperOpen" :file="pendingFile" @cancel="closeCropper" @confirm="onCropConfirm" />
    <UiConfirmDialog
      :open="confirmDelete"
      title="Delete account?"
      message="This permanently deletes your account and all your data. There is no recovery."
      confirmation="delete"
      confirm-label="Delete account"
      danger
      :busy="deleting"
      :error="deleteError"
      @cancel="confirmDelete = false"
      @confirm="deleteAccount"
    />
  </div>
</template>

<script setup lang="ts">
import type { SessionUser } from "#shared/contracts";
import { accountApi } from "~/services/account";
import { getApiErrorMessage } from "~/services/api";

const { user, fetch: refreshSession } = useUserSession();
const sessionUser = computed(() => user.value as SessionUser | null);
const username = computed(() => sessionUser.value?.username ?? "");
const avatar = ref("");
watchEffect(() => (avatar.value = sessionUser.value?.avatar ?? ""));

const message = ref("");
const error = ref("");
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
const cropperOpen = ref(false);
const pendingFile = ref<File | null>(null);
const confirmDelete = ref(false);
const deleting = ref(false);
const deleteError = ref("");
let messageTimer: ReturnType<typeof setTimeout> | null = null;

function showMessage(value: string) {
  message.value = value;
  if (messageTimer) clearTimeout(messageTimer);
  messageTimer = setTimeout(() => (message.value = ""), 2000);
}
onBeforeUnmount(() => {
  if (messageTimer) clearTimeout(messageTimer);
});
function pickFile(file?: File | null) {
  error.value = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    error.value = "Please select an image file.";
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    error.value = "Image must be 2 MB or smaller.";
    return;
  }
  pendingFile.value = file;
  cropperOpen.value = true;
}
function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  pickFile(input.files?.[0]);
  input.value = "";
}
function onDrop(event: DragEvent) {
  dragging.value = false;
  pickFile(event.dataTransfer?.files?.[0]);
}
function closeCropper() {
  cropperOpen.value = false;
  pendingFile.value = null;
}
async function onCropConfirm(blob: Blob) {
  closeCropper();
  uploading.value = true;
  error.value = "";
  try {
    const form = new FormData();
    form.append("file", blob, "avatar.webp");
    const result = await accountApi.uploadAvatar(form);
    avatar.value = result.avatar ?? "";
    await refreshSession();
    showMessage("Avatar updated");
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Upload failed");
  } finally {
    uploading.value = false;
  }
}
async function clearAvatar() {
  uploading.value = true;
  error.value = "";
  try {
    await accountApi.deleteAvatar();
    avatar.value = "";
    await refreshSession();
    showMessage("Avatar removed");
  } catch (cause) {
    error.value = getApiErrorMessage(cause, "Failed to remove avatar");
  } finally {
    uploading.value = false;
  }
}
async function deleteAccount() {
  deleting.value = true;
  deleteError.value = "";
  try {
    await accountApi.delete();
    await navigateTo("/login");
  } catch (cause) {
    deleteError.value = getApiErrorMessage(cause, "Failed to delete account");
  } finally {
    deleting.value = false;
  }
}
</script>
