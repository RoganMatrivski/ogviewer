import { Suspense } from "react";
import OGCard from "@/components/OGCard";
import { ModeToggle } from "@/components/ModeToggle";
import { NextResponse } from "next/server";
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
		Array.isArray(qParams[key])
			? (qParams[key][0] ?? "")
			: (qParams[key] ?? "");

	const listUrl = qGetter("list");

	let list: string[] = [];
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

	if (list.length <= 0)
		return NextResponse.json({ error: "Invalid list" }, { status: 400 });

	const parsedPage = Number.parseInt(qGetter("page"), 10);
	const page = Number.isNaN(parsedPage) ? 1 : Math.max(parsedPage, 1);

	const start = (page - 1) * itemsPerPage;
	const end = start + itemsPerPage;
	const items = list.slice(start, end);

	const newPageURLBuilder = (page: number) => {
		const urlParams = new URLSearchParams();

		// Had to manually set each params
		Object.entries(qParams).forEach(([key, value]) => {
			if (typeof value === "string") {
				urlParams.append(key, value);
			} else if (Array.isArray(value)) {
				value.forEach((v) => urlParams.append(key, v));
			}
			// skip undefined
		});
		urlParams.set("page", String(page));

		return `list?${urlParams.toString()}`;
	};

	return (
		<div className="container mx-auto p-4">
			{/* <ModeToggle /> */}
			<div className="my-2">
				<Pagination
					currentPage={page}
					itemsPerPage={itemsPerPage}
					totalItemCount={list.length}
					pageLinkGet={(page) => newPageURLBuilder(page)}
				/>
			</div>
			<div className="grid gap-4  lg:grid-cols-4 sm:grid-cols-2 ">
				{items.map((x) => (
					<Suspense
						key={x}
						fallback={
							<div className="animate-pulse bg-gray-200 h-40 rounded" />
						}
					>
						<OGCard.Wrapper url={x} />
					</Suspense>
				))}
			</div>
			<div className="my-2">
				<Pagination
					currentPage={page}
					itemsPerPage={itemsPerPage}
					totalItemCount={list.length}
					pageLinkGet={(page) => newPageURLBuilder(page)}
				/>
			</div>
			<UrlsDialog className="fixed bottom-5 right-5" />
		</div>
	);
}
