"use server";

import { AlertTriangle } from "lucide-react";
import Image from "next/image";
import getOG from "@/actions/FetchOG";
import type { OGMeta } from "@/types/OpenGraph";
import OGCardAddButton from "./OGCardAddButton";
import OGCardContent from "./OGCardContent";
import { Button } from "./ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";

type OGCardProps = {
	meta: OGMeta;
	link?: string;
};

export default async function OGCard({ meta }: OGCardProps) {
	const preview = meta.image || meta.video || "";
	return (
		<Card className="py-0 pb-6 overflow-hidden w-min-60 h-full bg-white text-black dark:bg-gray-900 dark:text-white">
			{meta.image ? (
				<div className="overflow-hidden h-[40vh]">
					<div className="relative w-full h-full overflow-hidden">
						<Image
							src={preview}
							alt="Website preview"
							className="absolute inset-0 w-full h-full object-cover blur-lg brightness-50"
							width="480"
							height="360"
						/>
						<Image
							src={preview}
							alt="Website preview"
							className="relative w-full h-full object-cover transition-all duration-500 hover:object-contain"
							width="480"
							height="360"
						/>
					</div>
				</div>
			) : (
				<div className="overflow-hidden h-[40vh] flex items-center justify-center">
					<span className="text-2xl">{meta.title}</span>
				</div>
			)}
			<CardHeader>
				<CardTitle className="text-ellipsis overflow-hidden">
					{meta.title}
				</CardTitle>
				<CardDescription className="text-gray-600 dark:text-gray-400 text-ellipsis overflow-hidden">
					{meta.url}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-grow">
				{/*<p className="text-gray-800 dark:text-gray-300 text-ellipsis overflow-x-hidden">
					{meta.description}
				</p>*/}

				<OGCardContent content={meta.description ?? ""} />
			</CardContent>
			<CardFooter className="flex flex-col gap-2 [&>button]:cursor-pointer">
				{/* <Button className="w-full h-20" variant="default">
					Add
				</Button> */}

				<OGCardAddButton url={meta.url || ""} />

				<Button className="w-full" variant="secondary" asChild>
					<a href={meta.url || undefined}>Visit</a>
				</Button>
			</CardFooter>
		</Card>
	);
}

type OGCardErrorProps = {
	message?: string;
	url?: string;
};

OGCard.Error = ({
	message = "Failed to load preview.",
	url,
}: OGCardErrorProps) => {
	return (
		<Card className="py-0 pb-6 overflow-hidden w-min-60 h-full border-red-500 bg-red-50 dark:bg-red-950 dark:border-red-400 text-red-800 dark:text-red-300">
			<div className="flex items-center justify-center h-[40vh] bg-red-100 dark:bg-red-900">
				<AlertTriangle className="w-12 h-12 mr-2" />
				<span className="text-lg font-semibold">Error Loading Preview</span>
			</div>
			<CardHeader>
				<CardTitle className="text-red-800 dark:text-red-300">Oops!</CardTitle>
				<CardDescription className="text-red-600 dark:text-red-400">
					{url || "Invalid or unreachable link"}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-grow">
				<p className="text-red-700 dark:text-red-400">{message}</p>
			</CardContent>
			<CardFooter className="flex flex-col gap-2 [&_a]:cursor-pointer [&_button]:cursor-pointer">
				<OGCardAddButton url={url || ""} />

				{url && (
					<Button className="w-full" variant="secondary" asChild>
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full"
						>
							Visit
						</a>
					</Button>
				)}
			</CardFooter>
		</Card>
	);
};

function ImageUrlToMeta(url: string) {
	const title = url.split("/").at(-1) || "Image";
	return {
		title,
		image: url,
		description: url,
	};
}

async function checkImage(url: string) {
	const res = await fetch(url);
	const buff = await res.blob();

	return buff.type.startsWith("image/");
}

OGCard.Wrapper = async ({ url }: { url: string }) => {
	try {
		const og = await getOG(url);
		if (!og || !og.title) {
			// If url is an image, construct meta from img URL
			if (
				url.match(/\.(jpeg|jpg|gif|png)$/) != null ||
				(await checkImage(url))
			) {
				const imgMeta = ImageUrlToMeta(url);
				return <OGCard meta={{ ...imgMeta, url, video: null }} />;
			}

			// If OG data is missing or incomplete, show a specific error
			return (
				<OGCard.Error
					message="No Open Graph data found for this URL."
					url={url}
				/>
			);
		}
		return <OGCard meta={og} />;
	} catch (error: any) {
		// console.error("Failed to fetch OG metadata:", error);

		let message = "Failed to load preview.";
		if (error?.response?.status === 404) {
			message = "Page not found (404).";
		} else if (error?.response?.status === 403) {
			message = "Access forbidden (403).";
		} else if (error instanceof Error && error.message) {
			message = `Error: ${error.message}`;
		}

		return <OGCard.Error message={message} url={url} />;
	}
};

OGCard.Loading = () => (
	<div className="animate-pulse bg-gray-900 h-[20vh] rounded" />
);
