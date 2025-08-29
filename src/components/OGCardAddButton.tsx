"use client";

import { twMerge } from "tailwind-merge";
import { Button } from "./ui/button";

import { useUrlStore } from "@/state/urlStore";
import * as R from "ramda";

interface OGCardAddButtonProps {
	url: string;
	className?: string;
}

export default function OGCardAddButton({
	url,
	className,
}: OGCardAddButtonProps) {
	const addUrl = useUrlStore((state) => state.addUrl);
	const removeUrl = useUrlStore((state) => state.removeUrl);
	const urls = useUrlStore((state) => state.urls);

	const inList = R.includes(url, urls);

	return (
		<Button
			className={twMerge("w-full h-20", className)}
			variant={!inList ? "default" : "destructive"}
			onClick={() => {
				console.log("button pressed", urls);
				if (!inList) {
					addUrl(url);
				} else {
					removeUrl(url);
				}
			}}
		>
			{!inList ? "Add" : "Remove"}
		</Button>
	);
}
