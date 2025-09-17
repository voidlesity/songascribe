<template v-if="categories">
  <dialog :open="dialog.visible" class="modal">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Create new Category</h3>
      <div class="card-body">
        <legend class="fieldset-legend">Category name</legend>
        <input v-model="selectedCategory.name" type="text" class="input w-full" placeholder="Characters" />
      </div>
      <div class="modal-action gap-1">
        <button @click="closeModal()" class="btn">Cancel</button>
        <button @click="createCategory()" class="btn bg-primary">Create</button>
      </div>
    </div>
  </dialog>
  <div class="card-body p-4">
    <h2 class="card-title">
      <div role="tablist" class="tabs tabs-box p-3">
        <a v-for="(cat, idx) in categories" :key="idx" @click="selected = idx" role="tab" {name, items: []} class="tab"
          :class="{ 'tab-active': idx == selected }">{{ cat.name }}</a>
        <a @click="openModal()" role="tab" class="tab tooltip" data-tip="Create new Category"
          style="font-weight: normal">
          <icon name="ic:round-plus" size="1.5rem" />
        </a>
      </div>
    </h2>
    <div class="tab-content bg-base-200 p-4 grid grid-cols-[repeat(auto-fit,_minmax(45vw,_1fr))] gap-4">
      <div v-for="(item, idx) in categories[selected].items" :key="idx" class="card bg-base-100 shadow-sm rounded-1xl">
        <div class="card-body p-4">
          <h2 class="card-title">{{ item.name }} <button class="btn btn-square">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5"
                stroke="currentColor" class="size-[1.2em]">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </button></h2>
          <div v-if="item.songIds.length == 1" style="height: 80px">
            <iframe :src="`https://open.spotify.com/embed/track/${item.songIds[0]}`"
              style="border-radius: 15px; height: 80px; width: 100%" />
          </div>
          <div v-else>
            <div class="carousel carousel-center rounded-box w-full gap-1">
              <div class="carousel-item w-9/10" v-for="(songId, idx) in item.songIds" :key="idx">
                <iframe :src="`https://open.spotify.com/embed/track/${songId}`"
                  style="border-radius: 15px; height: 80px; width: 100%" scrolling="no" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="card bg-base-100 shadow-sm rounded-1xl">
        <div class="card-body p-4">
          <div class="tooltip h-full w-full" :data-tip="`Create new Item for ${categories[selected].name}`">
            <a onclick="modal.showModal()" role="tab" class="tab h-full w-full">
              <icon name="ic:round-plus" size="4rem" />
            </a>
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
      selectedCategory: { name: null },
      selectedItem: null,
      selected: 0,
      dialog: {
        visible: false
      }
    };
  },
  methods: {
    openModal() {
      this.dialog.visible = true
    },
    closeModal() {
      this.dialog.visible = false
    },
    createCategory() {
      this.categories.push(this.selectedCategory)
      this.closeModal()
    },
  },
  created() {
    this.categories = useStore().categories;
  },
};
</script>
