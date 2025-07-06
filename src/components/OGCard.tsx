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

type OGCardProps = {
	meta: OGMeta;
	link?: string;
};

export default function OGCard({ meta }: OGCardProps) {
	const preview = meta.video || meta.image || "";
	return (
		<Card className="py-0 pb-6 overflow-hidden">
			<div className="overflow-hidden h-[40vh]">
				<img
					src={preview}
					alt="Preview"
					className="object-cover w-full h-full"
				/>
			</div>
			<CardHeader>
				<CardTitle>{meta.title}</CardTitle>

				<CardDescription>{meta.url}</CardDescription>
				{/* <CardAction>Action</CardAction> */}
			</CardHeader>
			<CardContent>
				<p>{meta.description}</p>
			</CardContent>
			<CardFooter className="flex flex-col gap-2">
				<Button className="w-full h-20" variant="default">
					Add
				</Button>
				<Button className="w-full" variant="secondary">
					Visit
				</Button>
			</CardFooter>
		</Card>
	);
}
