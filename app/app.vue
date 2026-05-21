<template>
  <NuxtRouteAnnouncer />
  <div class="min-h-screen flex flex-col bg-base-200">
    <AppNav v-if="loggedIn" />
    <main class="flex-1 pb-20 md:pb-0">
      <NuxtPage />
    </main>
    <AppDock v-if="loggedIn" />
    <MusicPlayerBar />
  </div>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession();
</script>
