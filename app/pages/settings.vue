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
        <div v-if="tab === 'profile'" class="space-y-3">
          <h2 class="font-semibold">Profile</h2>

          <div class="flex items-center gap-3">
            <div class="avatar">
              <div class="w-16 rounded-full bg-base-300">
                <img
                  v-if="profile.avatar"
                  :src="profile.avatar"
                  :alt="profile.displayName"
                >
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                >
                  <Icon name="mdi:account" size="2rem" />
                </div>
              </div>
            </div>
            <span class="text-sm opacity-60">Preview</span>
          </div>

          <label class="floating-label">
            <span>Display name</span>
            <input
              v-model="profile.displayName"
              type="text"
              class="input w-full"
              placeholder="Display name"
            >
          </label>

          <label class="floating-label">
            <span>Avatar URL</span>
            <input
              v-model="profile.avatar"
              type="url"
              class="input w-full"
              placeholder="https://…"
            >
          </label>

          <div class="card-actions justify-end items-center gap-3">
            <span v-if="message" class="text-success text-sm">{{
              message
            }}</span>
            <span v-if="error" class="text-error text-sm">{{ error }}</span>
            <button class="btn btn-primary" @click="saveProfile">Save</button>
          </div>
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["logged-in"] });

const { user, fetch: refreshSession } = useUserSession();
const { theme, setTheme } = useTheme();

const tab = ref<"profile" | "appearance">("profile");

const profile = reactive({
  displayName: "",
  avatar: "",
});

const message = ref("");
const error = ref("");

watchEffect(() => {
  const u = user.value as { displayName?: string; avatar?: string } | null;
  if (u) {
    profile.displayName = u.displayName ?? "";
    profile.avatar = u.avatar ?? "";
  }
});

async function saveProfile() {
  error.value = "";
  message.value = "";
  try {
    await $fetch("/api/users/me", {
      method: "PATCH",
      body: { displayName: profile.displayName, avatar: profile.avatar },
    });
    await refreshSession();
    message.value = "Saved";
    setTimeout(() => (message.value = ""), 1500);
  } catch (e) {
    error.value = (e as { statusMessage?: string }).statusMessage || "Failed";
  }
}
</script>
