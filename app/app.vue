<template>
  <NuxtRouteAnnouncer />
  <div class="min-h-screen flex flex-col bg-base-200">
    <AppNav />
    <main class="flex-1" :class="mainPaddingClass">
      <NuxtPage />
    </main>
    <AppDock v-if="loggedIn" />
    <MusicPlayerBar />
  </div>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession();
const { currentSong } = usePlayerStore();

const mainPaddingClass = computed(() => {
  const hasPlayer = !!currentSong.value;
  const hasDock = loggedIn.value;

  if (hasPlayer && hasDock) return "pb-36 md:pb-24";
  if (hasPlayer) return "pb-28 md:pb-24";
  if (hasDock) return "pb-20 md:pb-6";
  return "pb-6";
});
</script>
