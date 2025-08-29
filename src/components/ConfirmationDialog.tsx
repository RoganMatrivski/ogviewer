import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, type buttonVariants } from "./ui/button";
import type { VariantProps } from "class-variance-authority";

interface ConfirmationDialogProps {
	label: string;
	onConfirm: () => void;
}

export default function ConfirmationDialog({
	label,
	size,
	variant,
	onConfirm,
}: ConfirmationDialogProps & VariantProps<typeof buttonVariants>) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button size={size} variant={variant} className="cursor-pointer">
					{label}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove your data from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel className="cursor-pointer">
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction className="cursor-pointer" onClick={onConfirm}>
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
