import Link from "next/link";

interface PaginationProps {
	currentPage: number;
	itemsPerPage: number;
	totalItemCount: number;
	pageLinkGet: (pageNumber: number) => string;
	className?: string;
}

export function Pagination({
	currentPage,
	itemsPerPage,
	totalItemCount,
	pageLinkGet,
	className = "",
}: PaginationProps) {
	const totalPages = Math.ceil(totalItemCount / itemsPerPage);

	// Don't render pagination if there's only one page or no items
	if (totalPages <= 1) {
		return null;
	}

	// Generate array of page numbers to display
	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxVisiblePages = 7;

		if (totalPages <= maxVisiblePages) {
			// Show all pages if total is small
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Show first page
			pages.push(1);

			if (currentPage > 4) {
				pages.push("...");
			}

			// Show pages around current page
			const start = Math.max(2, currentPage - 1);
			const end = Math.min(totalPages - 1, currentPage + 1);

			for (let i = start; i <= end; i++) {
				pages.push(i);
			}

			if (currentPage < totalPages - 3) {
				pages.push("...");
			}

			// Show last page
			if (totalPages > 1) {
				pages.push(totalPages);
			}
		}

		return pages;
	};

	const pageNumbers = getPageNumbers();

	return (
		<nav
			className={`flex items-center justify-center space-x-1 ${className}`}
			aria-label="Pagination"
		>
			{/* Previous button */}
			<Link
				href={currentPage === 1 ? "#" : pageLinkGet(currentPage - 1)}
				className={`px-3 py-2 text-sm font-medium rounded-md border 
			text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700
			dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white
			${currentPage === 1 ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
				aria-label="Go to previous page"
			>
				Previous
			</Link>

			{/* Page numbers */}
			{pageNumbers.map((page, index) => {
				if (page === "...") {
					return (
						<span
							key={`ellipsis-${index}`}
							className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-400"
						>
							...
						</span>
					);
				}

				const pageNumber = page as number;
				const isCurrentPage = pageNumber === currentPage;

				return (
					<Link
						key={pageNumber}
						href={pageLinkGet(pageNumber)}
						className={`px-3 py-2 text-sm font-medium rounded-md border
					${
						isCurrentPage
							? "bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500"
							: "text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-900 							   dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
					}`}
						aria-label={`Go to page ${pageNumber}`}
						aria-current={isCurrentPage ? "page" : undefined}
					>
						{pageNumber}
					</Link>
				);
			})}

			{/* Next button */}
			<Link
				href={currentPage === totalPages ? "#" : pageLinkGet(currentPage + 1)}
				className={`px-3 py-2 text-sm font-medium rounded-md border 
			text-gray-500 bg-white border-gray-300 hover:bg-gray-50 hover:text-gray-700
			dark:text-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white
			${currentPage === totalPages ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
				aria-label="Go to next page"
			>
				Next
			</Link>
		</nav>
	);
}
