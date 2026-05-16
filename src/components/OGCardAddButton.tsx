"use client";

import * as R from "ramda";
import { twMerge } from "tailwind-merge";

import { useUrlStore } from "@/state/urlStore";
import { Button } from "./ui/button";

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
