<template>
  <NuxtRouteAnnouncer />
  <div class="min-h-screen flex flex-col bg-base-200">
    <AppNav />
    <main class="flex-1" :class="mainPaddingClass">
      <NuxtPage />
    </main>
    <AppFooter />
    <AppDock v-if="loggedIn" />
    <MusicPlayerBar />
  </div>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession();

const mainPaddingClass = computed(() =>
  loggedIn.value ? "pb-32 md:pb-0" : "pb-6",
);
</script>
