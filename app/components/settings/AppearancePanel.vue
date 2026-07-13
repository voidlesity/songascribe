<template>
  <div class="space-y-3">
    <h2 class="font-semibold">Theme</h2>
    <p class="text-sm opacity-60">Click a theme to apply it instantly.</p>
    <p v-if="themeError" class="alert alert-error text-sm">{{ themeError }}</p>
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      <button
        v-for="entry in DAISY_THEMES"
        :key="entry"
        :data-theme="entry"
        class="rounded-box border border-base-300 p-2 text-left hover:scale-[1.02] transition cursor-pointer bg-base-100"
        :class="{ 'ring-2 ring-primary': theme === entry }"
        :disabled="saving"
        @click="apply(entry)"
      >
        <div class="flex items-center gap-1 mb-2">
          <div class="w-3 h-3 rounded-full bg-primary" /><div class="w-3 h-3 rounded-full bg-secondary" />
          <div class="w-3 h-3 rounded-full bg-accent" /><div class="w-3 h-3 rounded-full bg-neutral" />
        </div>
        <span class="text-xs font-medium capitalize">{{ entry }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DAISY_THEMES, type DaisyTheme } from "~/composables/useTheme";

const { theme, themeError, setTheme } = useTheme();
const saving = ref(false);
async function apply(next: DaisyTheme) {
  saving.value = true;
  try {
    await setTheme(next);
  } catch {
    // The composable restores the previous theme and exposes the API error.
  } finally {
    saving.value = false;
  }
}
</script>
