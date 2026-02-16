<template>
  <NuxtRouteAnnouncer />
  <div class="navbar bg-base-300 shadow-sm">
    <div class="flex-1">
      <a class="btn btn-ghost text-xl" @click="$router.push('/')"
        >Songascribe</a
      >
    </div>
    <div class="flex gap-2">
      <!-- Desktop Navigation -->
      <div class="hidden md:flex gap-2">
        <button class="btn btn-ghost" @click="$router.push('/')">
          <Icon name="ic:round-home" size="1.2rem" />
          Home
        </button>
        <button class="btn btn-ghost" @click="$router.push('/statistics')">
          <Icon name="ic:round-analytics" size="1.2rem" />
          Statistics
        </button>
        <button class="btn btn-ghost" @click="$router.push('/browse')">
          <Icon name="ic:round-public" size="1.2rem" />
          Browse
        </button>
      </div>

      <!-- User Menu -->
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
          <div class="w-10 rounded-full">
            <img
              v-if="loggedIn"
              alt="Spotify profile picture"
              :title="user.name"
              :src="user.avatar"
            />
            <Icon v-else name="ic:round-person" size="2.5rem" />
          </div>
        </div>
        <ul
          tabindex="0"
          class="menu menu-sm dropdown-content bg-base-200 rounded-box z-1 mt-3 w-52 p-2 shadow"
        >
          <li class="md:hidden">
            <a @click="$router.push('/')">
              <Icon name="ic:round-home" size="1rem" />
              Home
            </a>
          </li>
          <li class="md:hidden">
            <a @click="$router.push('/statistics')">
              <Icon name="ic:round-analytics" size="1rem" />
              Statistics
            </a>
          </li>
          <li class="md:hidden">
            <a @click="$router.push('/browse')">
              <Icon name="ic:round-public" size="1rem" />
              Browse Public
            </a>
          </li>
          <li class="md:hidden"><div class="divider my-0"></div></li>
          <li>
            <a v-if="loggedIn" @click="handleLogout">
              <Icon name="ic:round-logout" size="1rem" />
              Logout
            </a>
            <a v-else href="/auth/spotify">
              <Icon name="ic:round-login" size="1rem" />
              Login
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <NuxtPage />
</template>

<script setup>
const { loggedIn, user, clear } = useUserSession();

async function handleLogout() {
  try {
    await clear();
    navigateTo("/");
  } catch (error) {
    console.error("Logout error:", error);
    navigateTo("/");
  }
}
</script>
