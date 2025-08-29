export const fetcher = <T = any>(url: string): Promise<T> =>
	fetch(url).then((res) => {
		if (!res.ok) throw new Error("Failed to fetch");
		return res.json();
	});
