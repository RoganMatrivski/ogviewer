"use client";

import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "./ui/button";

interface CopyButtonProps {
	value: string;
	defaultLabel?: string;
}

export default function CopyButton({ value, defaultLabel }: CopyButtonProps) {
	const [copyState, setCopyState] = useState<"idle" | "success" | "error">(
		"idle",
	);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopyState("success");
			setTimeout(() => setCopyState("idle"), 2000);
		} catch (_err: unknown) {
			setCopyState("error");
			setTimeout(() => setCopyState("idle"), 2000);
		}
	};

	const getContent = () => {
		switch (copyState) {
			case "success":
				return "Success";
			case "error":
				return "Failed";
			default:
				return defaultLabel || "Copy";
		}
	};

	const getButtonClasses = () => {
		const baseClasses = "cursor-pointer transition-all duration-200";

		switch (copyState) {
			case "success":
				return twMerge(
					baseClasses,
					"bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 focus:ring-green-200 dark:focus:ring-green-800",
				);
			case "error":
				return twMerge(
					baseClasses,
					"bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 focus:ring-red-200 dark:focus:ring-red-800",
				);
			default:
				return twMerge(baseClasses);
		}
	};

	return (
		<Button
			onClick={handleCopy}
			className={getButtonClasses()}
			variant="outline"
			title={
				copyState === "success"
					? "Copied!"
					: copyState === "error"
						? "Copy failed"
						: "Copy text"
			}
		>
			{getContent()}
		</Button>
	);
}
