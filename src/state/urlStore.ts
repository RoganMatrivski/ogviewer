import { create } from "zustand";
import * as R from "ramda";

interface UrlState {
	urls: string[];
	addUrl: (url: string) => void;
	removeUrl: (url: string) => void;
	clearUrl: () => void;
}

export const useUrlStore = create<UrlState>((set) => ({
	urls: [],
	addUrl: (url: string) =>
		set((state) => ({ urls: R.append(url, state.urls) })),
	removeUrl: (url: string) =>
		set((state) => ({ urls: R.without([url], state.urls) })),
	clearUrl: () => set(() => ({ urls: [] })),
}));
