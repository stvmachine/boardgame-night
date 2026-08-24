import { RefreshCw } from "lucide-react";
import { Button, Card, Eyebrow, Skeleton } from "@/components/atoms";
import { TrendingCard } from "@/components/molecules";
import { useHotItemsQuery } from "@/generated/operations";

function TrendingCardSkeleton() {
	return (
		<div
			aria-hidden="true"
			className="flex flex-col overflow-hidden rounded-card border border-line bg-surface"
		>
			<Skeleton className="aspect-[4/3] w-full rounded-none" />
			<div className="flex flex-col gap-1.5 p-2.5">
				<Skeleton className="h-3 w-3/4 rounded-full" />
				<Skeleton className="h-2.5 w-1/2 rounded-full" />
			</div>
		</div>
	);
}

export function HotGamesPage() {
	const { data, loading, error, refetch } = useHotItemsQuery();
	const items = data?.hotItems ?? [];

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
			<header className="mb-8 flex flex-col gap-2">
				<Eyebrow tone="primary">BoardGameGeek hotness</Eyebrow>
				<h1 className="text-h1 text-ink">Trending Games</h1>
				<p className="max-w-2xl text-ink-2">
					The complete current hot list, enriched with ratings, weight, player counts, and play
					time.
				</p>
			</header>

			{loading ? (
				<div
					className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6"
					aria-label="Loading trending games"
					aria-busy="true"
				>
					{Array.from({ length: 12 }, (_, index) => (
						<TrendingCardSkeleton key={index} />
					))}
				</div>
			) : error ? (
				<Card role="alert" className="flex flex-col items-start gap-4 p-6">
					<div className="flex flex-col gap-1">
						<h2 className="text-h3 text-ink">Couldn&rsquo;t load trending games</h2>
						<p className="text-sm text-muted">Please check your connection and try again.</p>
					</div>
					<Button type="button" variant="outline" onClick={() => void refetch()}>
						<RefreshCw className="size-4" aria-hidden="true" />
						Try again
					</Button>
				</Card>
			) : items.length > 0 ? (
				<div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
					{items.map((item) => (
						<a
							key={item.id}
							href={`https://boardgamegeek.com/boardgame/${encodeURIComponent(item.id)}`}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`${item.name} on BoardGameGeek (opens in a new tab)`}
							className="rounded-card outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
						>
							<TrendingCard
								rank={item.rank}
								title={item.name}
								cover={item.thumbnail}
								year={item.yearPublished ?? undefined}
								rating={item.average}
							/>
						</a>
					))}
				</div>
			) : (
				<Card role="status" className="p-6 text-sm text-muted">
					No trending games are available yet.
				</Card>
			)}
		</div>
	);
}
