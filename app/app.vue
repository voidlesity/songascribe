<template>
  <NuxtRouteAnnouncer />
  <div class="navbar bg-base-300 shadow-sm">
    <div class="flex-1">
      <a class="btn btn-ghost text-xl" @click="$router.push('/')"
        >Songascribe</a
      >
    </div>
    <div class="flex gap-2">
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
          <div class="w-10 rounded-full">
            <img
              v-if="loggedIn"
              alt="Spotify profile picture"
              :title="user.display_name"
              :src="user.images[0].url"
            />
            <icon v-else name="ic:round-person" size="2.5rem" />
          </div>
        </div>
        <ul
          tabindex="0"
          class="menu menu-sm dropdown-content bg-base-200 rounded-box z-1 mt-3 w-52 p-2 shadow"
        >
          <li><a @click="$router.push('settings')">Settings</a></li>
          <li>
            <a v-if="loggedIn" @click="clear">Logout</a>
            <a v-else href="/auth/spotify">Login</a>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <NuxtPage />
</template>

<script setup>
const { loggedIn, user, clear } = useUserSession();
</script>
