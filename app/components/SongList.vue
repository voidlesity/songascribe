<template>
  <TracksSongList
    :songs="songs"
    :item-name="itemName"
    :item-id="itemId"
    :category-name="categoryName"
    :category-id="categoryId"
    :empty="empty"
    :reorderable="reorderable"
    :reordering="reordering"
    @move="onMove"
  />
</template>

<script setup lang="ts">
import type { Track } from "~/composables/useTrackSearch";

withDefaults(
  defineProps<{
    songs: Track[];
    itemName?: string;
    itemId?: number;
    categoryName?: string;
    categoryId?: number;
    empty?: string;
    reorderable?: boolean;
    reordering?: boolean;
  }>(),
  { reorderable: false, reordering: false },
);

const emit = defineEmits<{ move: [index: number, direction: -1 | 1] }>();

function onMove(index: number, direction: -1 | 1) {
  emit("move", index, direction);
}
</script>
