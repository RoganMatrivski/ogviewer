"use client";

import Image from "next/image";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";

import { OGMeta } from "@/types/OpenGraph";
import { Button } from "./ui/button";
import getOG from "@/actions/FetchOG";
import { AlertTriangle } from "lucide-react";

type OGCardProps = {
	meta: OGMeta;
	link?: string;
};

export default function OGCard({ meta }: OGCardProps) {
	const preview = meta.video || meta.image || "";
	return (
		<Card className="py-0 pb-6 overflow-hidden w-min-60 h-full bg-white text-black dark:bg-gray-900 dark:text-white">
			<div className="overflow-hidden h-[40vh]">
				{preview ? (
					<Image
						src={preview}
						alt="Preview"
						className="object-cover w-full h-full blur-lg hover:blur-none transition-all"
						width="480"
						height="360"
					/>
				) : (
					<div className="h-full flex items-center justify-center">
						<span>Preview not available</span>
					</div>
				)}
			</div>
			<CardHeader>
				<CardTitle>{meta.title}</CardTitle>
				<CardDescription className="text-gray-600 dark:text-gray-400">
					{meta.url}
				</CardDescription>
			</CardHeader>
			<CardContent className="flex-grow">
				<p className="text-gray-800 dark:text-gray-300">{meta.description}</p>
			</CardContent>
			<CardFooter className="flex flex-col gap-2 [&>button]:cursor-pointer">
				<Button className="w-full h-20" variant="default">
					Add
				</Button>
				{meta.url && (
					<Button className="w-full" variant="secondary" asChild>
						<Link href={meta.url}>Visit</Link>
					</Button>
				)}
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
			<CardFooter className="flex flex-col gap-2 [&_a]:cursor-pointer">
				{url && (
					<Button className="w-full" variant="secondary" asChild>
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							className="w-full"
						>
							Visit Original
						</a>
					</Button>
				)}
			</CardFooter>
		</Card>
	);
};

import useSWR from "swr";
import createMetascraper from "metascraper";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";

export const OGCardClient = ({ url }: { url: string }) => {
	const { data, error, isLoading } = useSWR<createMetascraper.Metadata>(
		`/api/getog?url=${url}`,
		fetcher<createMetascraper.Metadata>,
	);

	if (isLoading)
		return <div className="animate-pulse bg-gray-200 h-40 rounded" />;
	if (!data || error)
		return (
			<OGCard.Error
				message={
					error
						? "Failed to load preview."
						: "No Open Graph data found for this URL."
				}
				url={url}
			/>
		);

	return (
		<div className="shadow-xl">
			<OGCard meta={data} link={url} />
		</div>
	);
};
