import { Suspense } from "react";
import OGCard from "@/components/OGCard";
import { ModeToggle } from "@/components/ModeToggle";

const urls = [
	"https://google.com",
	"https://youtube.com",
	"https://facebook.com",
	"https://instagram.com",
	"https://wikipedia.org",
	"https://yahoo.co.jp",
];

export default async function Home() {
	// const data = await Promise.allSettled(urls.map(getOG));
	return (
		<div className="container mx-auto p-4">
			<form className="mb-4 flex flex-col gap-2">
				<textarea
					className="border rounded p-2 w-full min-h-[80px] resize-y"
					placeholder="Enter URLs, one per line"
					rows={4}
				/>
				<button
					type="submit"
					className="self-end px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					Submit
				</button>
				<ModeToggle />
			</form>
			<div className="grid gap-4  lg:grid-cols-4 sm:grid-cols-2 ">
				{urls.map((x) => (
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
		</div>
	);
}
