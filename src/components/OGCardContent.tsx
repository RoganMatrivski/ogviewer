"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";

export default function OGCardContent({ content }: { content: string }) {
	const [expanded, setExpanded] = useState(false);
	const isTruncatable = content.length > 100;

	return (
		<>
			<motion.div
				animate={{ height: expanded ? "auto" : "4.5rem" }}
				transition={{ duration: 0.3, ease: "easeInOut" }}
				className="overflow-hidden"
			>
				<p className="text-gray-800 dark:text-gray-300">{content}</p>
			</motion.div>

			{isTruncatable && (
				<Button
					variant="ghost"
					size="sm"
					className="px-0 font-medium text-blue-600 dark:text-blue-400 hover:underline"
					onClick={() => setExpanded((prev) => !prev)}
				>
					{expanded ? "Read Less" : "Read More"}
				</Button>
			)}
		</>
	);
}
