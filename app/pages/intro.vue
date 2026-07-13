<template>
  <div class="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
    <section
      class="hero rounded-box bg-base-100 border border-base-300 overflow-hidden"
    >
      <div class="hero-content py-10 md:py-14 text-center">
        <div class="max-w-2xl space-y-4">
          <div
            class="inline-flex items-center gap-2 badge badge-primary badge-outline"
          >
            <Icon name="mdi:book-music" /> Songascribe
          </div>
          <h1 class="text-3xl md:text-5xl font-semibold leading-tight">
            Give every song a place
            <span class="text-primary">and a reason</span>
          </h1>
          <p class="text-sm md:text-base opacity-80">
            Organize tracks into categories and items, then optionally explain
            why each song belongs there. Perfect for moodboards, characters,
            projects, memories, and playlists with meaning.
          </p>

          <div class="flex flex-wrap justify-center gap-2 pt-2">
            <NuxtLink to="/login" class="btn btn-primary">
              <Icon name="mdi:login" /> Get started
            </NuxtLink>
            <NuxtLink to="/browse" class="btn btn-ghost">
              <Icon name="mdi:earth" /> Browse public categories
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-3 gap-3">
      <article class="card card-border bg-base-100">
        <div class="card-body p-4">
          <div class="text-primary text-xl">
            <Icon name="mdi:folder-multiple" />
          </div>
          <h2 class="font-semibold">Categorize your world</h2>
          <p class="text-sm opacity-70">
            Group items into themes like characters, places, projects, or vibes.
          </p>
        </div>
      </article>

      <article class="card card-border bg-base-100">
        <div class="card-body p-4">
          <div class="text-secondary text-xl">
            <Icon name="mdi:music-note" />
          </div>
          <h2 class="font-semibold">Attach tracks instantly</h2>
          <p class="text-sm opacity-70">
            Search tracks or paste URLs, then reorder songs as your narrative
            evolves.
          </p>
        </div>
      </article>

      <article class="card card-border bg-base-100">
        <div class="card-body p-4">
          <div class="text-accent text-xl">
            <Icon name="mdi:comment-text" />
          </div>
          <h2 class="font-semibold">Add per-song reasons</h2>
          <p class="text-sm opacity-70">
            Save context per item: why this exact song belongs with this exact
            thing.
          </p>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "public" });
useSeoMeta({
  title: "About · Songascribe",
  description: "Organize songs around ideas, moments, and meaningful context.",
});
</script>
