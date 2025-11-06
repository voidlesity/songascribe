<template v-if="categories">
  <dialog v-if="selectedCategory || selectedItem" open class="modal">
    <div class="modal-box">
      <h3 class="text-lg font-bold">Create new Category</h3>
      <div class="card-body">
        <legend class="fieldset-legend">Category name</legend>
        <input
          v-model="selectedCategory.name"
          type="text"
          class="input w-full"
          placeholder="Characters"
        />
      </div>
      <div class="modal-action gap-1">
        <button class="btn" @click="closeModal()">Cancel</button>
        <button class="btn bg-primary" @click="createCategory()">Create</button>
      </div>
    </div>
  </dialog>
  <div class="card-body p-4 bg-base-100">
    <div class="flex">
      <label class="input input-lg w-full">
        <icon name="ic:baseline-search" size="1.5rem" />
        <input
          type="search"
          class="grow"
          placeholder="Search for Songs or paste link"
        />
      </label>
      <button
        class="btn btn-primary h-auto tooltip tooltip-left"
        data-tip="Quick add Song"
        @click="openModal('addSong')"
      >
        <icon name="ic:round-plus" size="1.5rem" />
      </button>
    </div>

    <h2 class="card-title">
      <div role="tablist" class="tabs tabs-box p-3">
        <a
          v-for="(cat, idx) in categories"
          :key="idx"
          role="tab"
          class="tab"
          :class="{ 'tab-active': idx == selected }"
          @click="selected = idx"
          >{{ cat.name }}</a
        >
        <a
          role="tab"
          class="tab tooltip"
          data-tip="Create new Category"
          style="font-weight: normal"
          @click="openModal('newCategory')"
        >
          <icon name="ic:round-plus" size="1.5rem" />
        </a>
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
          <div class="card-title flex">
            <h2>{{ item.name }}</h2>
            <button
              class="btn btn-ghost btn-circle ml-auto tooltip font-normal"
              :data-tip="`Edit ${item.name}`"
            >
              <icon name="ic:edit" size="0.75rem" />
            </button>
          </div>
          <div v-if="item.songIds.length == 1" style="height: 80px">
            <iframe
              :src="`https://open.spotify.com/embed/track/${item.songIds[0]}`"
              style="border-radius: 15px; height: 80px; width: 100%"
            />
          </div>
          <div v-else>
            <div class="carousel carousel-center rounded-box w-full gap-1">
              <div
                v-for="(songId, idx) in item.songIds"
                :key="idx"
                class="carousel-item w-9/10"
              >
                <iframe
                  :src="`https://open.spotify.com/embed/track/${songId}`"
                  style="border-radius: 15px; height: 80px; width: 100%"
                  scrolling="no"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      categories: null,
      selectedCategory: null,
      selectedItem: null,
      selected: 0,
    };
  },
  created() {
    this.categories = [
      {
        name: "Characters",
        items: [
          {
            name: "Lola",
            songIds: [
              "6PA3RNr4T1f8Ze56vBGESB",
              "559K8nUEfwvXHHuPBgX2do",
              "5amqt1t0f5mq8zX0xGlT19",
            ],
          },
          {
            name: "Akira",
            songIds: [
              "1oHbgg5WYa7WOJC8VoBVYi",
              "0Mjb8viquEZn6E5RrfxsHE",
              "4S0zagxseJHOL5ZVnTQA6X",
              "1msD6DT04B7lwD5F1qCSlL",
            ],
          },
          {
            name: "Leo",
            songIds: ["5ww51aDl5gIrLgamIMvywo"],
          },
          {
            name: "Tate",
            songIds: ["0rCPywvi7aXlK2uwypkZAM", "4XSlqvVREKMkNmvLoro1Ku"],
          },
        ],
      },
      {
        name: "Places",
        items: [
          {
            name: "Suntides",
            songIds: ["4CnIxrp7yazTYbjYrDtNSZ"],
          },
          {
            name: "Spooky Forest",
            songIds: ["6tlKLobnqnDdmrhtgnP6Rn"],
          },
          {
            name: "Beach Resort",
            songIds: ["2rCrt6lNSz5k554jOOSvIN"],
          },
          {
            name: "Cruise Ship",
            songIds: ["5T2Cft0v1qKSmH0GUDzB2b", "4ry7YKyh7eiIrWpVEdTJFR"],
          },
        ],
      },
    ];
  },
  methods: {
    openModal(mode) {
      if (mode == "newCategory") {
        this.selectedCategory = { name: null };
      }
    },
    closeModal() {
      this.selectedCategory = null;
      this.selectedItem = null;
    },
    createCategory() {
      this.categories.push(this.selectedCategory);
      this.closeModal();
    },
  },
};
</script>
