<template>
  <NuxtRouteAnnouncer />
  <div class="navbar bg-base-100 shadow-sm">
    <div class="flex-1">
      <a class="btn btn-ghost text-xl" @click="navigateTo('/')"
        ><Icon name="mdi:book-music" />Songascribe</a
      >
    </div>
    <div class="flex-none">
      <div class="hidden md:flex gap-2">
        <button class="btn btn-ghost" @click="navigateTo('/')">
          <Icon name="mdi:home" size="1.25rem" />
          Home
        </button>
        <button class="btn btn-ghost" @click="navigateTo('/statistics')">
          <Icon name="mdi:analytics" size="1.25rem" />
          Statistics
        </button>
        <button class="btn btn-ghost" @click="navigateTo('/browse')">
          <Icon name="mdi:public" size="1.25em" />
          Browse
        </button>
        <button class="btn btn-ghost" @click="navigateTo('/settings')">
          <Icon name="mdi:settings" size="1.25rem" />
          Settings
        </button>
      </div>
    </div>
  </div>
  <NuxtPage class="bg-base-200" />
  <MusicPlayerBar />
</template>
