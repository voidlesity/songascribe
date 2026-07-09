<template>
  <NuxtRouteAnnouncer />
  <div class="min-h-screen flex flex-col bg-base-200">
    <AppNav />
    <main class="flex-1">
      <NuxtPage />
    </main>
    <AppFooter />
    <AppDock v-if="loggedIn" />
    <MusicPlayerBar />
  </div>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession();
</script>
