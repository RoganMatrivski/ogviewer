// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function Home() {
	return (
		<div className="flex items-center justify-center h-screen">
			<span className="text-4xl">Hi. Bye.</span>
		</div>
	);
}
