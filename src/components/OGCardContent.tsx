"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "./ui/button";

export default function OGCardContent({ content }: { content: string }) {
	const [expanded, setExpanded] = useState(false);

	return (
		<>
			<motion.div
				key={expanded ? "expanded" : "collapsed"}
				initial={{ height: 0, opacity: 0 }}
				animate={{
					height: "auto",
					opacity: 1,
				}}
				exit={{ height: 0, opacity: 0 }}
				transition={{ duration: 0.3, ease: "easeInOut" }}
				className="overflow-hidden"
			>
				<p className={`text-gray-800 dark:text-gray-300`}>{content}</p>
			</motion.div>

			{content.length > 100 && (
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
