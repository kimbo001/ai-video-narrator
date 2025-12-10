// src/store/useStoryStore.ts
import { create } from 'zustand';
import { StoryVariation, GenerationMode } from '../types';

interface StoryState {
  mode: GenerationMode;
  variations: StoryVariation[];
  selectedVariationIds: string[];
  setMode: (mode: GenerationMode) => void;
  setVariations: (variations: StoryVariation[]) => void;
  toggleVariation: (id: string) => void;
  reset: () => void;
}

export const useStoryStore = create<StoryState>((set) => ({
  mode: 'single',
  variations: [],
  selectedVariationIds: [],
  setMode: (mode) => set({ mode, variations: [], selectedVariationIds: [] }),
  setVariations: (variations) =>
    set({
      variations,
      selectedVariationIds: variations.map((v) => v.id),
    }),
  toggleVariation: (id) =>
    set((state) => ({
      selectedVariationIds: state.selectedVariationIds.includes(id)
        ? state.selectedVariationIds.filter((x) => x !== id)
        : [...state.selectedVariationIds, id],
    })),
  reset: () => set({ mode: 'single', variations: [], selectedVariationIds: [] }),
}));
