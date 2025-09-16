<template v-if="categories">
  <dialog id="modal" class="modal">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Create new Category</h3>
      <div class="card-body">
        <fieldset class="fieldset">
          <legend class="fieldset-legend">Category name</legend>
          <input type="text" class="input w-full" placeholder="Characters" />
        </fieldset>
      </div>
      <div class="modal-action gap-1">
        <form method="dialog">
          <button class="btn">Cancel</button>
        </form>
        <button class="btn bg-primary">Create</button>
      </div>
    </div>
  </dialog>
  <div class="card-body p-4">
    <h2 class="card-title">
      <div role="tablist" class="tabs tabs-box p-3">
        <a
          v-for="(cat, idx) in categories"
          :key="idx"
          @click="selected = idx"
          role="tab"
          class="tab"
          :class="{ 'tab-active': idx == selected }"
          >{{ cat.name }}</a
        >
        <a onclick="modal.showModal()" role="tab" class="tab"
          ><icon name="ic:round-plus"
        /></a>
      </div>
    </h2>
    <div
      class="tab-content bg-base-200 p-4 grid grid-cols-[repeat(auto-fit,_minmax(45vw,_1fr))] gap-4"
    >
      <div
        v-for="(item, idx) in categories[selected].items"
        :key="idx"
        class="card bg-base-100 shadow-sm rounded-1xl"
      >
        <div class="card-body p-4">
          <h2 class="card-title">{{ item.name }}</h2>
          <div v-if="item.songIds.length == 1" style="height: 80px">
            <iframe
              :src="`https://open.spotify.com/embed/track/${item.songIds[0]}`"
              style="border-radius: 15px; height: 80px; width: 100%"
              allow="clipboard-write *; encrypted-media *; fullscreen *; picture-in-picture *;"
            ></iframe>
          </div>
          <div v-else>
            <div class="carousel carousel-center rounded-box w-full gap-1">
              <div
                class="carousel-item w-9/10"
                v-for="(songId, idx) in item.songIds"
                :key="idx"
              >
                <iframe
                  :src="`https://open.spotify.com/embed/track/${songId}`"
                  style="border-radius: 15px; height: 80px; width: 100%"
                  scrolling="no"
                  allow="clipboard-write *; encrypted-media *; fullscreen *; picture-in-picture *;"
                ></iframe>
              </div>
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
