import { Suspense } from "react";
import { CollectionBrowser } from "@/components/collection/collection-browser";
import { SkeletonGrid } from "@/components/molecules/game-card";

export function CollectionPage() {
	return (
		<Suspense
			fallback={
				<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
					<SkeletonGrid count={12} />
				</div>
			}
		>
			<CollectionBrowser />
		</Suspense>
	);
}
