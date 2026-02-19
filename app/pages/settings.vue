<template>
  <div class="min-h-screen bg-base-200 p-4">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold mb-8 flex items-center gap-2">
        <Icon name="ic:round-settings" size="2rem" />
        Settings
      </h1>

      <!-- Profile Settings Card -->
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">
            <Icon name="ic:round-person" size="1.5rem" />
            Profile Settings
          </h2>

          <form @submit.prevent="saveProfile">
            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text font-semibold">Display Name</span>
              </label>
              <input
                v-model="profileForm.name"
                type="text"
                placeholder="Your name"
                class="input input-bordered w-full"
                required
              />
            </div>

            <div class="form-control mb-4">
              <label class="label">
                <span class="label-text font-semibold">Avatar URL</span>
              </label>
              <input
                v-model="profileForm.avatar"
                type="url"
                placeholder="https://example.com/avatar.jpg"
                class="input input-bordered w-full"
                required
              />
              <label class="label">
                <span class="label-text-alt text-gray-500"
                  >Enter a valid image URL for your avatar</span
                >
              </label>
            </div>

            <div v-if="profileForm.avatar" class="mb-4">
              <div class="avatar">
                <div
                  class="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2"
                >
                  <img :src="profileForm.avatar" alt="Avatar preview" />
                </div>
              </div>
            </div>

            <div
              v-if="profileMessage"
              class="alert mb-4"
              :class="
                profileMessageType === 'success'
                  ? 'alert-success'
                  : 'alert-error'
              "
            >
              <Icon
                :name="
                  profileMessageType === 'success'
                    ? 'ic:round-check-circle'
                    : 'ic:round-error'
                "
                size="1.5rem"
              />
              <span>{{ profileMessage }}</span>
            </div>

            <button
              type="submit"
              class="btn btn-primary"
              :disabled="savingProfile"
            >
              <Icon v-if="!savingProfile" name="ic:round-save" size="1.2rem" />
              <span v-if="savingProfile" class="loading loading-spinner"></span>
              {{ savingProfile ? "Saving..." : "Save Profile" }}
            </button>
          </form>
        </div>
      </div>

      <!-- Theme Settings Card -->
      <div class="card bg-base-100 shadow-xl mb-6">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">
            <Icon name="ic:round-palette" size="1.5rem" />
            Theme Settings
          </h2>

          <div class="form-control mb-4">
            <label class="label">
              <span class="label-text font-semibold">Choose Theme</span>
            </label>
            <select
              v-model="selectedTheme"
              class="select select-bordered w-full"
              @change="changeTheme"
            >
              <option v-for="theme in themes" :key="theme" :value="theme">
                {{ formatThemeName(theme) }}
              </option>
            </select>
          </div>

          <div
            v-if="themeMessage"
            class="alert mb-4"
            :class="
              themeMessageType === 'success' ? 'alert-success' : 'alert-error'
            "
          >
            <Icon
              :name="
                themeMessageType === 'success'
                  ? 'ic:round-check-circle'
                  : 'ic:round-error'
              "
              size="1.5rem"
            />
            <span>{{ themeMessage }}</span>
          </div>

          <!-- Theme Preview -->
          <div class="mt-4">
            <label class="label">
              <span class="label-text font-semibold">Theme Preview</span>
            </label>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div class="flex flex-col items-center gap-1">
                <div class="bg-primary w-full h-8 rounded"></div>
                <span class="text-xs">Primary</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <div class="bg-secondary w-full h-8 rounded"></div>
                <span class="text-xs">Secondary</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <div class="bg-accent w-full h-8 rounded"></div>
                <span class="text-xs">Accent</span>
              </div>
              <div class="flex flex-col items-center gap-1">
                <div class="bg-neutral w-full h-8 rounded"></div>
                <span class="text-xs">Neutral</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Danger Zone Card -->
      <div class="card bg-base-100 shadow-xl border-2 border-error">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4 text-error">
            <Icon name="ic:round-warning" size="1.5rem" />
            Account Information
          </h2>
          <p class="text-sm opacity-70 mb-4">
            Logging out will clear your session and return you to the login
            page.
          </p>
          <div class="flex gap-2">
            <button class="btn btn-error" @click="handleLogout">
              <Icon name="ic:round-logout" size="1.2rem" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { loggedIn, user, clear, fetch: fetchSession } = useUserSession();

// DaisyUI themes
const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
];

const selectedTheme = ref("dark");
const profileForm = ref({
  name: "",
  avatar: "",
});

const savingProfile = ref(false);
const profileMessage = ref("");
const profileMessageType = ref("success");

const themeMessage = ref("");
const themeMessageType = ref("success");

// Check if user is logged in
onMounted(async () => {
  if (!loggedIn.value) {
    navigateTo("/login");
    return;
  }

  await loadUserData();
});

async function loadUserData() {
  try {
    const userDataRaw = await $fetch("/api/user/me");
    const userData = Array.isArray(userDataRaw) ? userDataRaw[0] : userDataRaw;
    if (!userData) return;
    profileForm.value.name = userData.name;
    profileForm.value.avatar = userData.avatar;
    selectedTheme.value = userData.theme || "dark";

    // Apply the theme
    if (import.meta.client) {
      document.documentElement.setAttribute("data-theme", selectedTheme.value);
    }
  } catch (error) {
    console.error("Failed to load user data:", error);
  }
}

async function saveProfile() {
  savingProfile.value = true;
  profileMessage.value = "";

  try {
    await $fetch("/api/user/profile", {
      method: "PUT",
      body: {
        name: profileForm.value.name,
        avatar: profileForm.value.avatar,
      },
    });

    // Refresh the session
    await fetchSession();

    profileMessage.value = "Profile updated successfully!";
    profileMessageType.value = "success";

    setTimeout(() => {
      profileMessage.value = "";
    }, 3000);
  } catch (error) {
    console.error("Failed to update profile:", error);
    profileMessage.value = "Failed to update profile. Please try again.";
    profileMessageType.value = "error";
  } finally {
    savingProfile.value = false;
  }
}

async function changeTheme() {
  themeMessage.value = "";

  try {
    // Apply theme immediately for instant feedback
    if (import.meta.client) {
      document.documentElement.setAttribute("data-theme", selectedTheme.value);
    }

    // Save to database
    await $fetch("/api/user/theme", {
      method: "PUT",
      body: {
        theme: selectedTheme.value,
      },
    });

    // Refresh the session
    await fetchSession();

    themeMessage.value = "Theme updated successfully!";
    themeMessageType.value = "success";

    setTimeout(() => {
      themeMessage.value = "";
    }, 3000);
  } catch (error) {
    console.error("Failed to update theme:", error);
    themeMessage.value = "Failed to update theme. Please try again.";
    themeMessageType.value = "error";
  }
}

function formatThemeName(theme) {
  return theme
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function handleLogout() {
  try {
    await clear();
    navigateTo("/");
  } catch (error) {
    console.error("Logout error:", error);
    navigateTo("/");
  }
}

watch(loggedIn, (value) => {
  if (!value) {
    navigateTo("/login");
  }
});
</script>
