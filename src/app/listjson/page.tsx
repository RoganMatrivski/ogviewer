"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OGCardClient } from "@/components/OGCardClient";

type ExpectedJson = {
	url: string;
};

export default function List() {
	const searchParams = useSearchParams();
	const url = searchParams.get("url");
	const [urls, setUrls] = useState<string[]>([]);

	useEffect(() => {
		if (url)
			fetch(url)
				.then((x) => x.json<ExpectedJson[]>())
				.then((x) => x.slice(0, 24).map((x) => x.url))
				.then(setUrls);
	}, [url]);

	useEffect(() => {
		console.log(urls);
	}, [urls]);

	return (
		<div className="container mx-auto p-4">
			<div className="grid gap-4 lg:grid-cols-4 sm:grid-cols-2 ">
				{urls &&
					urls.length > 0 &&
					urls.map((x) => <OGCardClient key={x} url={x} />)}
			</div>
		</div>
	);
}
