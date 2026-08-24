import type { Game, Suggestion } from "@/lib/data";
import { RankedGameCard } from "@/components/molecules/ranked-game-card";
import { RankedGameRow } from "@/components/molecules/ranked-game-row";
import { cn } from "@/lib/utils";

export type RankedItem = { key: string; game: Game; suggestion: Suggestion };

/**
 * RankedList — the ranked-for-tonight column. The #1 pick gets the full hero
 * card; runners-up collapse to scannable rows sharing the same score/reason
 * language. A dashed footer accounts for lower-scoring games that still fit.
 */
export function RankedList({
	items,
	fitSummary,
	isHost = true,
	picking = false,
	pickError,
	selectedKey,
	rowLimit = 3,
	onPick,
	onWhy,
	className,
}: {
	items: RankedItem[];
	fitSummary?: string;
	isHost?: boolean;
	picking?: boolean;
	pickError?: string | null;
	selectedKey?: string;
	rowLimit?: number;
	onPick?: (item: RankedItem) => void;
	onWhy?: (item: RankedItem) => void;
	className?: string;
}) {
	if (items.length === 0) {
		return (
			<div
				className={cn(
					"flex flex-col items-center gap-2 rounded-card border border-dashed border-line bg-surface px-6 py-12 text-center",
					className,
				)}
			>
				<p className="font-display text-lg font-bold text-ink">No games fit this night</p>
				<p className="text-sm text-muted">
					Loosen the player count, time budget or complexity to see more of the shelf ranked.
				</p>
			</div>
		);
	}

	const [top, ...rest] = items;
	const rows = rest.slice(0, rowLimit);
	const remaining = rest.length - rows.length;

	return (
		<div data-testid="suggestion-grid" className={cn("flex flex-col gap-4", className)}>
			<div className="flex items-baseline justify-between gap-3">
				<h2 className="text-h3 text-ink">Ranked for tonight</h2>
				{fitSummary && <span className="numeric text-xs text-muted">{fitSummary}</span>}
			</div>

			<RankedGameCard
				game={top.game}
				suggestion={top.suggestion}
				rank={1}
				isHost={isHost}
				picking={picking}
				pickError={pickError}
				selected={selectedKey === top.key}
				onPick={onPick ? () => onPick(top) : undefined}
				onWhy={onWhy ? () => onWhy(top) : undefined}
			/>

			{rows.length > 0 && (
				<div className="flex flex-col gap-2">
					{rows.map((item, i) => (
						<RankedGameRow
							key={item.key}
							game={item.game}
							suggestion={item.suggestion}
							rank={i + 2}
							isHost={isHost}
							picking={picking}
							onPick={onPick ? () => onPick(item) : undefined}
						/>
					))}
				</div>
			)}

			{remaining > 0 && (
				<p className="rounded-card border border-dashed border-line px-3.5 py-2.5 text-[13px] text-muted">
					{remaining} more {remaining === 1 ? "game" : "games"} fit, lower down the ranking —
					tighten or loosen the constraints to reshuffle them.
				</p>
			)}
		</div>
	);
}
