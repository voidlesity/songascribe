import { defineStore } from "pinia";

export const useStore = defineStore("store", {
  state: () => {
    return {
      categories: [
        {
          name: "Characters",
          items: [
            {
              name: "Sven",
              songIds: ["2AFeu1UxqSnidAzmg2bJIX", "5pQrKA3Rj4vlLDt6Ed2TdS"],
            },
          ],
        },
      ],
    };
  },
  persist: true,
});
