<template>
  <header
    class="navbar bg-base-100 border-b border-base-300 px-4 sticky top-0 z-40"
  >
    <div class="flex-1 flex justify-start min-w-0">
      <NuxtLink
        :to="homeTo"
        class="btn btn-ghost px-2 text-lg font-semibold gap-2"
      >
        <Icon name="mdi:book-music" class="text-primary" size="1.5rem" />
        <span class="hidden sm:inline">Songascribe</span>
      </NuxtLink>
    </div>

    <div
      v-if="loggedIn"
      class="flex-1 flex justify-center min-w-0 max-w-md px-2"
    >
      <AppGlobalSearch />
    </div>

    <div class="flex-1 flex justify-end items-center gap-1 min-w-0">
      <nav class="hidden md:flex items-center gap-1">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="btn btn-ghost btn-sm gap-2"
          :class="{ 'btn-active': route.path === link.to }"
        >
          <Icon :name="link.icon" />
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="flex-none ml-1">
        <div v-if="user" class="dropdown dropdown-end">
          <div
            tabindex="0"
            role="button"
            class="btn btn-ghost btn-circle avatar"
          >
            <div
              class="w-9 rounded-full"
              :class="{ 'bg-primary text-primary-content': !avatar }"
            >
              <img v-if="avatar" :src="avatar" :alt="initials" />
              <span
                v-else
                class="flex items-center justify-center w-full h-full font-semibold"
              >
                {{ initials }}
              </span>
            </div>
          </div>
          <ul
            tabindex="0"
            class="menu menu-sm dropdown-content bg-base-100 border border-base-300 rounded-box z-50 mt-3 w-52 p-2 shadow-xl"
          >
            <li>
              <NuxtLink to="/settings">
                <Icon name="mdi:cog" /> Settings
              </NuxtLink>
            </li>
            <li>
              <button @click="logout"><Icon name="mdi:logout" /> Logout</button>
            </li>
          </ul>
        </div>
        <NuxtLink v-else to="/login" class="btn btn-primary btn-sm">
          <Icon name="mdi:login" /> Login
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { user, loggedIn, clear } = useUserSession();
const route = useRoute();
const links = computed(() =>
  loggedIn.value ? authenticatedNavLinks : guestNavLinks,
);
const initials = computed(
  () => user.value?.username.charAt(0).toUpperCase() ?? "?",
);
const avatar = computed(() => user.value?.avatar);
const homeTo = computed(() => (loggedIn.value ? "/" : "/intro"));

async function logout() {
  await clear();
  await navigateTo("/login");
}
</script>
