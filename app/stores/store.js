import { defineStore } from "pinia";

export const useStore = defineStore("store", {
  state: () => {
    return {
      categories: [
        {
          name: "Example",
          items: [
            {
              name: "Example 1",
              songIds: ["2AFeu1UxqSnidAzmg2bJIX"],
            },
          ],
        },
      ],
    };
  },
});
