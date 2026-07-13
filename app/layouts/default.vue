<template>
  <div class="min-h-screen flex flex-col bg-base-200">
    <AppNav />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter :mobile-dock="loggedIn" />
    <AppDock v-if="loggedIn" />
    <MusicPlayerBar v-if="loggedIn" />
  </div>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession();
</script>
