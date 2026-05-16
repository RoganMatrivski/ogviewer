"use client";

import { Cross, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { twMerge } from "tailwind-merge";
import { useUrlStore } from "@/state/urlStore";
import ConfirmationDialog from "./ConfirmationDialog";
import CopyButton from "./CopyButton";

interface UrlsDialogProps {
	className?: string;
}

export default function UrlsDialog({ className }: UrlsDialogProps) {
	const urls = useUrlStore((state) => state.urls);
	const removeUrl = useUrlStore((state) => state.removeUrl);
	const clearUrl = useUrlStore((state) => state.clearUrl);

	const joinedUrls = urls.join("\n");

	return (
		<Dialog.Root>
			<Dialog.Trigger asChild>
				<button
					type="button"
					className={twMerge(
						"cursor-pointer inline-flex h-[3rem] items-center justify-center rounded bg-background outline-1 outline-black dark:outline-white px-[15px] font-medium leading-none select-none",
						className,
					)}
				>
					Show URLs
				</button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="fixed inset-0 bg-background/50 data-[state=open]:animate-overlayShow" />
				<Dialog.Content
					aria-describedby={undefined}
					className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-md bg-background p-[25px] shadow-[var(--shadow-6)] focus:outline-none data-[state=open]:animate-contentShow"
				>
					<Dialog.Title className="m-0 text-[17px] font-medium text-mauve12">
						URL list
					</Dialog.Title>
					{/* <Dialog.Description className="mb-5 mt-2.5 text-[15px] leading-normal text-mauve11">
						Here's your URLs yadda yadda
					</Dialog.Description> */}

					<div className="mt-3 h-[60vh] overflow-y-auto outline-1 outline-foreground rounded-sm">
						{urls.map((x) => (
							<UrlItem key={x} url={x} onRemove={removeUrl} />
						))}
					</div>

					{urls.length > 0 && (
						<div className="mt-[25px] flex justify-end space-x-2">
							<CopyButton value={joinedUrls} defaultLabel="Copy URLs" />
							<ConfirmationDialog
								variant="destructive"
								label="Clear URLs"
								onConfirm={clearUrl}
							/>
						</div>
					)}

					{/* Dialog close button */}
					<Dialog.Close asChild>
						<button
							type="button"
							className="absolute right-2.5 top-2.5 inline-flex size-[2rem] appearance-none items-center justify-center rounded-full text-foreground hover:outline-1 hover:outline-foreground cursor-pointer"
							aria-label="Close"
						>
							<X />
						</button>
					</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}

function UrlItem({
	url,
	onRemove,
}: {
	url: string;
	onRemove: (url: string) => void;
}) {
	return (
		<div className="flex p-3 justify-between space-x-2 items-center hover:bg-foreground/10">
			<span className="text-medium text-ellipsis overflow-hidden">{url}</span>
			<button
				type="button"
				className="hover:outline-1 outline-foreground cursor-pointer size-[2rem] rounded-full flex items-center justify-center"
				onClick={() => onRemove(url)}
			>
				<X />
			</button>
		</div>
	);
}
