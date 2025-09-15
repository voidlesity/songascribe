<template v-if="categories">
  <div class="card card-border bg-base-100">
    <div class="card-body">
      <h2 class="card-title">
        <div role="tablist" class="tabs tabs-box">
          <a
            v-for="(cat, idx) in categories"
            :key="idx"
            @click="selected = idx"
            role="tab"
            class="tab"
            :class="{ 'tab-active': idx == selected }"
            >{{ cat.name }}</a
          >
          <a role="tab" class="tab"><icon name="ic:round-plus" /></a>
        </div>
      </h2>
      <div
        class="tab-content bg-base-100 border-base-300 p-6 grid h-56 grid-cols-2 content-start gap-5"
      >
        <div
          v-for="(item, idx) in categories[selected].items"
          :key="idx"
          class="card bg-base-200 w-96 shadow-sm"
        >
          <div class="card-body">
            <h2 class="card-title">{{ item.name }}</h2>
            <div
              v-for="(songId, idx) in item.songIds"
              :key="idx"
              style="left: 0; width: 100%; height: 152px; position: relative"
            >
              <iframe
                :src="`https://open.spotify.com/embed/track/${songId}`"
                style="
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  position: absolute;
                  border: 0;
                "
                allow="clipboard-write *; encrypted-media *; fullscreen *; picture-in-picture *;"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { useStore } from "#imports";

export default {
  data() {
    return {
      categories: null,
      selected: 0,
    };
  },
  methods: {},
  created() {
    this.categories = useStore().categories;
  },
};
</script>
