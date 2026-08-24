import { Check } from "lucide-react";
import type { Game } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/atoms/avatar";
import { Skeleton } from "@/components/atoms/skeleton";
import { GameCover } from "./game-cover";

/**
 * OwnerStack — who on the shelf owns this game, as overlapping initial discs.
 */
function OwnerStack({ owners }: { owners: string[] }) {
	const shown = owners.slice(0, 3);
	const rest = owners.length - shown.length;
	return (
		<div className="flex items-center" aria-label={`Owned by ${owners.join(", ")}`}>
			{shown.map((owner) => (
				<Avatar
					key={owner}
					name={owner}
					seed={owner}
					size="xs"
					ring
					className="-ml-1.5 first:ml-0"
				/>
			))}
			{rest > 0 && (
				<span className="numeric -ml-1.5 inline-flex size-5 items-center justify-center rounded-pill bg-inset text-[9px] font-bold text-ink-2 ring-2 ring-surface">
					+{rest}
				</span>
			)}
		</div>
	);
}

/**
 * GameCard — a game on the merged shelf. Cover with a strong fallback + gold
 * rating badge, name, blurb, then a mono stat line (players · time · weight)
 * and the owner stack. `selected` marks the game chosen for tonight.
 */
export type GameCardVariant = "grid" | "list";

export function GameCard({
	game,
	variant = "grid",
	selected = false,
	href,
	className,
}: {
	game: Game;
	variant?: GameCardVariant;
	selected?: boolean;
	href?: string;
	className?: string;
}) {
	const link = href ?? `https://boardgamegeek.com/boardgame/${encodeURIComponent(game.id)}`;
	const list = variant === "list";
	return (
		<article
			data-testid="game-card"
			data-slot="card"
			data-variant={variant}
			className={cn(
				"lift group/card relative overflow-hidden rounded-card bg-surface",
				list ? "flex flex-row" : "flex flex-col",
				selected
					? "border-2 border-primary shadow-lift"
					: "border border-line shadow-card hover:border-line-soft hover:shadow-lift",
				className,
			)}
		>
			<a
				data-testid="game-card-link"
				href={link}
				target="_blank"
				rel="noopener noreferrer"
				aria-label={`View ${game.title} on BoardGameGeek`}
				className="absolute inset-0 z-10 rounded-card outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
			/>

			<GameCover
				title={game.title}
				cover={game.cover}
				rating={game.rating}
				className={cn(list ? "aspect-[3/4] w-24 shrink-0" : "aspect-[4/3] w-full")}
			>
				{selected && !list && (
					<span className="numeric absolute inset-x-2 bottom-2 rounded-chip bg-primary px-2 py-1.5 text-center text-[10px] font-bold tracking-[0.08em] text-primary-fg">
						<Check className="mr-1 inline size-3" aria-hidden="true" />
						PLAYING TONIGHT
					</span>
				)}
			</GameCover>

			<div className="flex flex-1 flex-col gap-2 p-3">
				<h3 className="line-clamp-1 text-[15px] leading-tight font-medium text-ink">
					{game.title}
				</h3>
				{game.description && (
					<p
						data-testid="game-description"
						className={cn(
							"text-xs leading-relaxed text-muted",
							list ? "line-clamp-2" : "line-clamp-2",
						)}
					>
						{game.description}
					</p>
				)}
				<div
					data-testid="game-card-footer"
					className={cn(
						"numeric mt-auto flex items-center justify-between text-[11px]",
						selected ? "text-primary" : "text-ink-2",
					)}
				>
					<span>
						{game.minPlayers}–{game.maxPlayers}
					</span>
					<span>{game.minutes}m</span>
					<span>wt {game.weight.toFixed(1)}</span>
					{game.owners.length > 0 && <OwnerStack owners={game.owners} />}
				</div>
			</div>
		</article>
	);
}

export function GameCardSkeleton({
	variant = "grid",
	className,
}: {
	variant?: GameCardVariant;
	className?: string;
}) {
	const list = variant === "list";
	return (
		<div
			aria-hidden="true"
			className={cn(
				"overflow-hidden rounded-card border border-line bg-surface",
				list ? "flex flex-row" : "flex flex-col",
				className,
			)}
		>
			<Skeleton
				className={cn("rounded-none", list ? "aspect-[3/4] w-24 shrink-0" : "aspect-[4/3] w-full")}
			/>
			<div className="flex flex-1 flex-col gap-2 p-3">
				<Skeleton className="h-3.5 w-3/4 rounded-full" />
				<Skeleton className="h-2.5 w-full rounded-full" />
				<Skeleton className="h-2.5 w-1/2 rounded-full" />
			</div>
		</div>
	);
}

/** SkeletonGrid — the loading placeholder for the shelf grid / list. */
export function SkeletonGrid({
	count = 12,
	variant = "grid",
}: {
	count?: number;
	variant?: GameCardVariant;
}) {
	return (
		<div
			className={cn(
				variant === "grid"
					? "grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4"
					: "grid grid-cols-1 gap-3",
			)}
		>
			{Array.from({ length: count }).map((_, i) => (
				<GameCardSkeleton key={i} variant={variant} />
			))}
		</div>
	);
}
