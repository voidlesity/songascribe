<template>
  <aside class="drawer-side z-30 top-16!" :class="heightClass">
    <label for="cat-drawer" aria-label="close sidebar" class="drawer-overlay" />
    <div class="bg-base-100 border-r border-base-300 w-72 h-full flex flex-col">
      <div class="p-3 border-b border-base-300 flex items-center gap-2 shrink-0">
        <span class="text-xs uppercase opacity-60 flex-1 font-medium">Categories</span>
        <button class="btn btn-ghost btn-xs btn-square" title="New category" @click="emit('new')">
          <Icon name="mdi:plus" />
        </button>
      </div>
      <ul class="menu menu-sm p-2 flex-1 overflow-y-auto">
        <li v-for="category in categories" :key="category.id">
          <button
            class="justify-between"
            :class="{ 'menu-active': category.id === selectedId }"
            @click="emit('select', category.id)"
          >
            <span class="truncate flex items-center gap-2">
              <Icon :name="category.isPublic ? 'mdi:earth' : 'mdi:folder'" class="opacity-70" />
              {{ category.name }}
            </span>
            <span class="badge badge-ghost badge-sm">{{ category.items.length }}</span>
          </button>
        </li>
        <li v-if="!categories.length" class="text-xs opacity-50 p-3">No categories yet</li>
      </ul>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { Category } from "#shared/contracts";

defineProps<{ categories: Category[]; selectedId: number | null; heightClass: string }>();
const emit = defineEmits<{ select: [id: number]; new: [] }>();
</script>
