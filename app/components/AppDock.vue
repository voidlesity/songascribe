<template>
  <div class="dock dock-sm md:hidden bg-base-100 border-t border-base-300">
    <NuxtLink
      v-for="link in links"
      :key="link.to"
      :to="link.to"
      :class="{ 'dock-active': route.path === link.to }"
    >
      <Icon :name="link.icon" size="1.25rem" />
      <span class="dock-label">{{ link.label }}</span>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

const links = [
  { to: "/", label: "Home", icon: "mdi:home" },
  { to: "/browse", label: "Browse", icon: "mdi:earth" },
  { to: "/statistics", label: "Stats", icon: "mdi:chart-line" },
  { to: "/settings", label: "Settings", icon: "mdi:cog" },
];
</script>
