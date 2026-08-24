import { Link } from "react-router-dom";
import { Skeleton } from "@/components/atoms";
import { TrendingCard } from "@/components/molecules";
import type { HotItemsQuery } from "@/generated/operations";

export type TrendingItem = HotItemsQuery["hotItems"][number];

/**
 * TrendingStrip — the live BGG hot list as a dense 6-up strip of TrendingCards
 * (6 → 3 → 2 columns). Handles loading, error and empty states. Anchored at
 * #trending for the public nav.
 */
export function TrendingStrip({
	items,
	loading,
	error,
}: {
	items: TrendingItem[];
	loading: boolean;
	error: boolean;
}) {
	return (
		<section
			id="trending"
			className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16"
			aria-busy={loading}
		>
			<div className="mb-5 flex flex-wrap items-baseline gap-3">
				<h2 className="font-display text-[22px] font-bold text-ink">Trending on BGG</h2>
				<span className="numeric text-[11px] text-faint">live hotness · updated hourly</span>
				<Link to="/hot" className="ml-auto text-sm text-primary hover:underline">
					See all 50
				</Link>
			</div>

			{loading ? (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
					{Array.from({ length: 6 }, (_, index) => (
						<div
							key={index}
							className="flex flex-col overflow-hidden rounded-card border border-line bg-surface"
							aria-hidden="true"
						>
							<Skeleton className="aspect-[4/3] w-full rounded-none" />
							<div className="flex flex-col gap-1.5 p-2.5">
								<Skeleton className="h-3.5 w-4/5 rounded-full" />
								<Skeleton className="h-2.5 w-1/2 rounded-full" />
							</div>
						</div>
					))}
				</div>
			) : error ? (
				<p
					role="status"
					className="rounded-card border border-line bg-surface p-6 text-sm text-muted"
				>
					Trending games are unavailable right now.
				</p>
			) : items.length > 0 ? (
				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
					{items.map((item) => (
						<TrendingCard
							key={item.id}
							rank={item.rank}
							title={item.name}
							cover={item.thumbnail}
							year={item.yearPublished ?? undefined}
							rating={item.average}
						/>
					))}
				</div>
			) : (
				<p
					role="status"
					className="rounded-card border border-line bg-surface p-6 text-sm text-muted"
				>
					No trending games are available yet.
				</p>
			)}
		</section>
	);
}
