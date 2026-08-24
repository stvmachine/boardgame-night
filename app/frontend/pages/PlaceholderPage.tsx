import { EmptyState, FannedCovers } from "@/components/molecules";

export function PlaceholderPage({ title }: { title: string }) {
	return (
		<div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
			<EmptyState
				layout="center"
				visual={<FannedCovers />}
				title={title}
				description="This page is under construction. Check back soon."
			/>
		</div>
	);
}
