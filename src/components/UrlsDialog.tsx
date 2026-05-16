"use client";

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { twMerge } from "tailwind-merge";
import { useState } from "react";
import { useUrlStore } from "@/state/urlStore";
import ConfirmationDialog from "./ConfirmationDialog";
import CopyButton from "./CopyButton";

interface UrlsDialogProps {
	className?: string;
}

export default function UrlsDialog({ className }: UrlsDialogProps) {
	const [isOpen, setIsOpen] = useState(false);
	const urls = useUrlStore((state) => state.urls);
	const removeUrl = useUrlStore((state) => state.removeUrl);
	const clearUrl = useUrlStore((state) => state.clearUrl);

	const joinedUrls = urls.join("\n");

	return (
		<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
			<Dialog.Trigger asChild>
				<button
					type="button"
					className={twMerge(
						"rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 cursor-pointer select-none",
						className,
					)}
				>
					Show URLs
				</button>
			</Dialog.Trigger>
			<AnimatePresence>
				{isOpen && (
					<Dialog.Portal forceMount>
						<Dialog.Overlay asChild>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="fixed inset-0 bg-background/50 z-[100]"
							/>
						</Dialog.Overlay>
						<Dialog.Content asChild>
							<motion.div
								initial={{ opacity: 0, scale: 0.95, y: "-48%" }}
								animate={{ opacity: 1, scale: 1, y: "-50%" }}
								exit={{ opacity: 0, scale: 0.95, y: "-48%" }}
								transition={{ duration: 0.2, ease: "easeOut" }}
								className="fixed left-1/2 top-1/2 max-h-[85vh] w-[90vw] max-w-[500px] -translate-x-1/2 rounded-md bg-background p-[25px] shadow-[var(--shadow-6)] focus:outline-none z-[101]"
							>
								<Dialog.Title className="m-0 text-[17px] font-medium text-foreground">
									URL list
								</Dialog.Title>

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

								<Dialog.Close asChild>
									<button
										type="button"
										className="absolute right-2.5 top-2.5 inline-flex size-[2rem] appearance-none items-center justify-center rounded-full text-foreground hover:outline-1 hover:outline-foreground cursor-pointer"
										aria-label="Close"
									>
										<X />
									</button>
								</Dialog.Close>
							</motion.div>
						</Dialog.Content>
					</Dialog.Portal>
				)}
			</AnimatePresence>
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
