<template>
  <footer
    class="border-t border-base-300 bg-base-100/80 backdrop-blur"
    :class="loggedIn ? 'pb-24 md:pb-4' : 'pb-6'"
  >
    <div
      class="max-w-6xl mx-auto px-4 pt-4 md:px-6 md:pt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <p class="font-medium">Songascribe</p>
        <p class="text-xs opacity-70">
          Tie songs to ideas, moments, and categories.
        </p>
      </div>

      <nav class="flex flex-wrap items-center gap-2 text-sm">
        <NuxtLink to="/intro" class="btn btn-ghost btn-xs">
          <Icon name="mdi:book-open-variant" /> Intro
        </NuxtLink>
        <a href="/api/" class="btn btn-ghost btn-xs">
          <Icon name="mdi:api" /> API Docs
        </a>
      </nav>
    </div>
  </footer>
</template>

<script setup lang="ts">
const { loggedIn } = useUserSession();
</script>
