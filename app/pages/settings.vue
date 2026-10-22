<template>
  <UiPageContainer title="Settings" width="narrow" class="space-y-4">
    <div role="tablist" class="tabs tabs-box">
      <button
        v-for="entry in tabs"
        :key="entry.id"
        role="tab"
        class="tab"
        :class="{ 'tab-active': tab === entry.id }"
        @click="tab = entry.id"
      >
        <Icon :name="entry.icon" /> {{ entry.label }}
      </button>
    </div>

    <div class="card card-border bg-base-100">
      <div class="card-body">
        <SettingsProfilePanel v-if="tab === 'profile'" />
        <SettingsAppearancePanel v-else-if="tab === 'appearance'" />
        <SettingsLibraryPanel v-else />
      </div>
    </div>
  </UiPageContainer>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
useSeoMeta({ title: "Settings · Songascribe" });

type SettingsTab = "profile" | "appearance" | "library";
const tab = ref<SettingsTab>("profile");
const tabs: Array<{ id: SettingsTab; label: string; icon: string }> = [
  { id: "profile", label: "Profile", icon: "mdi:account" },
  { id: "appearance", label: "Appearance", icon: "mdi:palette" },
  { id: "library", label: "Library", icon: "mdi:database-export" },
];
</script>
