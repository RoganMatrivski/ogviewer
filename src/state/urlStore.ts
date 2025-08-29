import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as R from "ramda";

interface UrlState {
	urls: string[];
	addUrl: (url: string) => void;
	removeUrl: (url: string) => void;
	clearUrl: () => void;
}

export const useUrlStore = create<UrlState>()(
	persist(
		(set) => ({
			urls: [],
			addUrl: (url: string) =>
				set((state) => ({ urls: R.append(url, state.urls) })),
			removeUrl: (url: string) =>
				set((state) => ({ urls: R.without([url], state.urls) })),
			clearUrl: () => set(() => ({ urls: [] })),
		}),
		{
			name: "urls-state", // name of the item in the storage (must be unique)
			storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
			partialize: (state) => ({ urls: state.urls }),
		},
	),
);
