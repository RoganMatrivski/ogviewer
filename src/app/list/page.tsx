import { Suspense } from "react";
import OGCard from "@/components/OGCard";
import { Pagination } from "@/components/pagination";
import UrlsDialog from "@/components/UrlsDialog";

const itemsPerPage = 12;

export default async function ListLinePerUrl({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	const qParams = await searchParams;
	const qGetter = (key: string) =>
		Array.isArray(qParams[key]) ? qParams[key][0] : qParams[key];

	const listUrl = qGetter("list") ?? qGetter("file") ?? "";
	const filterQuery = qGetter("filter")?.trim() ?? "";

	let list: string[] = [];
	if (listUrl) {
		try {
			const res = await fetch(listUrl);
			if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
			const text = await res.text();
			list = text
				.split("\n")
				.map((line) => line.trim())
				.filter(Boolean);
		} catch (err) {
			console.error("Error fetching list:", err);
			list = [];
		}
	}
	if (!listUrl) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[90vh] px-4">
				<form
					method="GET"
					action="/list"
					className="w-full max-w-md flex flex-col gap-4"
				>
					<input
						type="text"
						name="list"
						placeholder="Paste list URL here..."
						className="w-full rounded border border-input bg-background px-4 py-2"
					/>
					<button
						type="submit"
						className="w-full rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
					>
						Load
					</button>
				</form>
			</div>
		);
	}

	if (list.length <= 0)
		return (
			<div className="container mx-auto p-16 text-center">
				<h2 className="text-2xl font-bold mb-4">Invalid or Empty List</h2>
				<p className="mb-8 text-muted-foreground">
					We couldn't find any URLs at: {listUrl}
				</p>
				<a href="/list" className="text-primary hover:underline font-medium">
					Try another URL
				</a>
			</div>
		);

	const filteredList = filterQuery
		? list.filter((url) =>
				url.toLowerCase().includes(filterQuery.toLowerCase()),
			)
		: list;

	const parsedPage = Number.parseInt(qGetter("page") ?? "", 10);
	const page = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1);

	const start = (page - 1) * itemsPerPage;
	const end = start + itemsPerPage;
	const items = filteredList.slice(start, end);

	const newPageURLBuilder = (targetPage: number) => {
		const urlParams = new URLSearchParams();
		Object.entries(qParams).forEach(([key, value]) => {
			if (typeof value === "string") {
				urlParams.append(key, value);
			} else if (Array.isArray(value)) {
				value.forEach((v) => {
					urlParams.append(key, v);
				});
			}
		});
		urlParams.set("page", String(targetPage));
		return `/list?${urlParams.toString()}`;
	};

	return (
		<div className="container mx-auto px-4 pb-4">
			{/* <ModeToggle /> */}

			{/* Top controls: file input + filter + pagination - STICKY */}
			<div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-4 mb-4 border-b">
				<form method="GET" action="/list" className="space-y-2">
					{/* Row 1: file URL + filter inputs */}
					<div className="flex flex-col gap-2 sm:flex-row">
						<input
							type="text"
							name="list"
							defaultValue={listUrl}
							placeholder="File URL (one URL per line)…"
							className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						/>
						<input
							type="text"
							name="filter"
							defaultValue={filterQuery}
							placeholder="Filter URLs…"
							className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:w-56"
						/>
						<button
							type="submit"
							className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
						>
							Go
						</button>
					</div>

					{/* Row 2: pagination + result count + URLs button */}
					<div className="flex items-center justify-between gap-2">
						<Pagination
							currentPage={page}
							itemsPerPage={itemsPerPage}
							totalItemCount={filteredList.length}
							pageLinkGet={(p) => newPageURLBuilder(p)}
						/>
						<div className="flex items-center gap-4">
							{filterQuery && (
								<span className="shrink-0 text-sm text-muted-foreground">
									{filteredList.length} / {list.length} URLs
								</span>
							)}
							<UrlsDialog />
						</div>
					</div>
				</form>
			</div>

			{filteredList.length === 0 ? (
				<p className="py-16 text-center text-muted-foreground">
					No URLs match &ldquo;{filterQuery}&rdquo;.
				</p>
			) : (
				<div className="grid gap-4 lg:grid-cols-4 sm:grid-cols-2">
					{items.map((x, idx) => (
						<Suspense key={`${page}-${idx}-${x}`} fallback={<OGCard.Loading />}>
							<OGCard.Wrapper url={x} />
						</Suspense>
					))}
				</div>
			)}
		</div>
	);
}
