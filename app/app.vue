<template>
  <div>
    <NuxtRouteAnnouncer />
    <div class="navbar bg-base-300 shadow-sm">
      <div class="flex-1">
        <a @click="$router.push('/')" class="btn btn-ghost text-xl">Songascribe</a>
      </div>
      <div class="flex gap-2">
        <div class="dropdown dropdown-end">
          <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
            <div class="w-10 rounded-full">
              <img alt="Spotify profile picture" src="https://cdn.voidlesity.dev/assets/images/random/bort.png" />
            </div>
          </div>
          <ul tabindex="0" class="menu menu-sm dropdown-content bg-base-200 rounded-box z-1 mt-3 w-52 p-2 shadow">
            <li><a @click="$router.push('settings')">Settings</a></li>
            <li><a>Logout</a></li>
          </ul>
        </div>
      </div>
    </div>
    <NuxtPage />
  </div>
</template>
