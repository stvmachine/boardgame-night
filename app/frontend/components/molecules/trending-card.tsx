import { Link } from "react-router-dom";
import { GameCover } from "./game-cover";
import { cn } from "@/lib/utils";

/**
 * TrendingCard — a dense hot-list tile: cover with a rank badge, then title +
 * a mono year · rating (or the honest "not rated yet"). Used on the landing
 * trending strip and the Hot Games grid.
 */
export function TrendingCard({
	rank,
	title,
	cover,
	year,
	rating,
	to,
	className,
}: {
	rank: number;
	title: string;
	cover?: string | null;
	year?: string | number;
	rating?: number | null;
	to?: string;
	className?: string;
}) {
	const body = (
		<>
			<GameCover title={title} cover={cover} rank={rank} className="aspect-[4/3] w-full" />
			<div className="flex flex-col gap-1 p-2.5">
				<span className="line-clamp-1 text-[13px] leading-tight font-medium">{title}</span>
				<span className="numeric text-[10px] text-faint">
					{year}
					{rating != null ? (
						<>
							{" · "}
							<span className="text-star">★</span> {rating.toFixed(1)}
						</>
					) : (
						" · not rated yet"
					)}
				</span>
			</div>
		</>
	);

	const shell = cn(
		"lift flex flex-col overflow-hidden rounded-card border border-line bg-surface",
		className,
	);

	return to ? (
		<Link to={to} data-testid="trending-card" className={shell}>
			{body}
		</Link>
	) : (
		<div data-testid="trending-card" className={shell}>
			{body}
		</div>
	);
}
