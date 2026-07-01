<template>
  <div class="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
    <h1 class="text-2xl font-semibold">Settings</h1>

    <div role="tablist" class="tabs tabs-box">
      <button
        role="tab"
        class="tab"
        :class="{ 'tab-active': tab === 'profile' }"
        @click="tab = 'profile'"
      >
        <Icon name="mdi:account" /> Profile
      </button>
      <button
        role="tab"
        class="tab"
        :class="{ 'tab-active': tab === 'appearance' }"
        @click="tab = 'appearance'"
      >
        <Icon name="mdi:palette" /> Appearance
      </button>
    </div>

    <div class="card card-border bg-base-100">
      <div class="card-body">
        <div v-if="tab === 'profile'" class="space-y-5">
          <div>
            <h2 class="font-semibold">Profile</h2>
            <p class="text-sm opacity-60">Upload a picture to personalize your account.</p>
          </div>

          <div class="flex flex-col sm:flex-row items-center gap-6">
            <button
              type="button"
              class="group relative shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              :class="dragging ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100' : ''"
              aria-label="Upload avatar"
              @click="fileInput?.click()"
              @dragover.prevent="dragging = true"
              @dragleave.prevent="dragging = false"
              @drop.prevent="onDrop"
            >
              <div class="avatar">
                <div class="w-28 rounded-full bg-base-300 ring-1 ring-base-300">
                  <img
                    v-if="profile.avatar"
                    :src="profile.avatar"
                    :alt="username"
                  >
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center opacity-40"
                  >
                    <Icon name="mdi:account" size="3rem" />
                  </div>
                </div>
              </div>
              <div
                class="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center gap-1 opacity-0 transition group-hover:opacity-100"
                :class="dragging ? 'opacity-100' : ''"
              >
                <Icon name="mdi:camera-plus-outline" size="1.5rem" />
                <span class="text-xs font-medium">Change</span>
              </div>
              <div
                v-if="uploading"
                class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center"
              >
                <span class="loading loading-spinner text-white" />
              </div>
            </button>

            <div class="flex-1 text-center sm:text-left space-y-2">
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onFileChange"
              >
              <div class="flex flex-wrap justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-outline"
                  :disabled="uploading"
                  @click="fileInput?.click()"
                >
                  <Icon name="mdi:upload" /> Upload image
                </button>
                <button
                  v-if="profile.avatar"
                  type="button"
                  class="btn btn-sm btn-ghost text-error"
                  :disabled="uploading"
                  @click="clearAvatar"
                >
                  <Icon name="mdi:delete-outline" /> Remove
                </button>
              </div>
              <p class="text-xs opacity-50">Drag &amp; drop or click. JPG, PNG or WebP, up to 2 MB.</p>
              <Transition name="fade">
                <p v-if="message" class="text-success text-xs flex items-center gap-1 justify-center sm:justify-start">
                  <Icon name="mdi:check-circle" /> {{ message }}
                </p>
              </Transition>
              <p v-if="uploadError" class="text-error text-xs">{{ uploadError }}</p>
            </div>
          </div>

          <div class="divider" />

          <div>
            <h2 class="font-semibold text-error mb-1">Danger zone</h2>
            <p class="text-sm opacity-60 mb-3">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
            <button class="btn btn-error btn-outline btn-sm" @click="confirmDelete = true">
              <Icon name="mdi:delete-forever" /> Delete account
            </button>
          </div>

          <dialog v-if="confirmDelete" class="modal modal-open">
            <div class="modal-box">
              <h3 class="font-bold text-lg text-error">Delete account?</h3>
              <p class="py-4 text-sm">
                This will permanently delete your account and all your data. There is no way to recover it.
              </p>
              <p class="text-sm opacity-60 mb-4">
                Type <strong>delete</strong> to confirm.
              </p>
              <input
                v-model="deleteConfirmText"
                type="text"
                class="input input-bordered w-full mb-4"
                placeholder="delete"
              >
              <div class="modal-action">
                <button class="btn btn-ghost" @click="confirmDelete = false; deleteConfirmText = ''">Cancel</button>
                <button
                  class="btn btn-error"
                  :disabled="deleteConfirmText !== 'delete' || deleting"
                  @click="deleteAccount"
                >
                  <span v-if="deleting" class="loading loading-spinner loading-xs" />
                  Delete account
                </button>
              </div>
            </div>
            <div class="modal-backdrop" @click="confirmDelete = false; deleteConfirmText = ''" />
          </dialog>
        </div>

        <div v-else class="space-y-3">
          <h2 class="font-semibold">Theme</h2>
          <p class="text-sm opacity-60">Click a theme to apply it instantly.</p>

          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            <button
              v-for="t in DAISY_THEMES"
              :key="t"
              :data-theme="t"
              class="rounded-box border border-base-300 p-2 text-left hover:scale-[1.02] transition cursor-pointer bg-base-100"
              :class="{ 'ring-2 ring-primary': theme === t }"
              @click="setTheme(t)"
            >
              <div class="flex items-center gap-1 mb-2">
                <div class="w-3 h-3 rounded-full bg-primary" />
                <div class="w-3 h-3 rounded-full bg-secondary" />
                <div class="w-3 h-3 rounded-full bg-accent" />
                <div class="w-3 h-3 rounded-full bg-neutral" />
              </div>
              <span class="text-xs font-medium capitalize">{{ t }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <AvatarCropper
      :open="cropperOpen"
      :file="pendingFile"
      @cancel="closeCropper"
      @confirm="onCropConfirm"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["logged-in"] });

const { user, fetch: refreshSession } = useUserSession();
const { theme, setTheme } = useTheme();

const tab = ref<"profile" | "appearance">("profile");

const profile = reactive({
  avatar: "",
});

const message = ref("");
const error = ref("");
const uploadError = ref("");
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const dragging = ref(false);

const cropperOpen = ref(false);
const pendingFile = ref<File | null>(null);

function pickFile(file: File | undefined | null) {
  uploadError.value = "";
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    uploadError.value = "Please select an image file.";
    return;
  }
  pendingFile.value = file;
  cropperOpen.value = true;
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  pickFile(input.files?.[0]);
  input.value = "";
}

function onDrop(e: DragEvent) {
  dragging.value = false;
  pickFile(e.dataTransfer?.files?.[0]);
}

function closeCropper() {
  cropperOpen.value = false;
  pendingFile.value = null;
}

async function onCropConfirm(blob: Blob) {
  cropperOpen.value = false;
  pendingFile.value = null;
  uploadError.value = "";
  error.value = "";
  message.value = "";
  uploading.value = true;
  try {
    const form = new FormData();
    form.append("file", blob, "avatar.webp");
    const res = await $fetch<{ avatar: string | null }>(
      "/api/users/me/avatar",
      { method: "POST", body: form },
    );
    profile.avatar = res.avatar ?? "";
    await refreshSession();
    message.value = "Avatar updated";
    setTimeout(() => (message.value = ""), 2000);
  } catch (e) {
    uploadError.value =
      (e as { statusMessage?: string }).statusMessage || "Upload failed";
  } finally {
    uploading.value = false;
  }
}

async function clearAvatar() {
  uploadError.value = "";
  error.value = "";
  message.value = "";
  uploading.value = true;
  try {
    await $fetch("/api/users/me/avatar", { method: "DELETE" });
    profile.avatar = "";
    await refreshSession();
    message.value = "Avatar removed";
    setTimeout(() => (message.value = ""), 2000);
  } catch (e) {
    uploadError.value =
      (e as { statusMessage?: string }).statusMessage || "Failed to remove";
  } finally {
    uploading.value = false;
  }
}

const username = computed(
  () => (user.value as { username?: string } | null)?.username ?? "",
);

watchEffect(() => {
  const u = user.value as { avatar?: string } | null;
  if (u) {
    profile.avatar = u.avatar ?? "";
  }
});

const confirmDelete = ref(false);
const deleteConfirmText = ref("");
const deleting = ref(false);

async function deleteAccount() {
  deleting.value = true;
  try {
    await $fetch("/api/users/me", { method: "DELETE" });
    await navigateTo("/login");
  } catch (e) {
    error.value = (e as { statusMessage?: string }).statusMessage || "Failed to delete account";
    confirmDelete.value = false;
    deleteConfirmText.value = "";
  } finally {
    deleting.value = false;
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
