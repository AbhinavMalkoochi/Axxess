import { create } from "zustand";
import { persist } from "zustand/middleware";

type graphStore = {
  value: string;
  setValue: (newValue: string) => void;
};

export const useGraphStore = create<graphStore>()(
  persist(
    (set) => ({
      value: "",
      setValue: (newValue) => set({ value: newValue }),
    }),
    {
      name: "string-storage", // Key in localStorage
    }
  )
);
