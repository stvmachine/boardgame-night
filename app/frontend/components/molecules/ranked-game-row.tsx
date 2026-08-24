import type { Game, Suggestion } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/button";
import { Meter } from "@/components/atoms/meter";
import { Score } from "@/components/atoms/score";
import { GameCover } from "./game-cover";
import { ReasonChipList } from "./reason-chip-list";

/**
 * RankedGameRow — a runner-up suggestion. Same score/reason language as the
 * hero card, compressed to a single scannable line: rank, mini cover, name +
 * mono facts, reason chips, then a mini meter, score and Pick.
 */
export function RankedGameRow({
	game,
	suggestion,
	rank,
	isHost = true,
	picking = false,
	onPick,
	className,
}: {
	game: Game;
	suggestion: Suggestion;
	rank: number;
	isHost?: boolean;
	picking?: boolean;
	onPick?: () => void;
	className?: string;
}) {
	const warn = suggestion.match < 75;
	return (
		<div
			data-testid="ranked-game-row"
			className={cn(
				"flex flex-wrap items-center gap-3.5 rounded-card border border-line bg-surface px-3.5 py-3",
				className,
			)}
		>
			<span className="numeric w-5 shrink-0 text-[11px] font-bold text-muted">#{rank}</span>
			<GameCover
				title={game.title}
				cover={game.cover}
				className="h-12 w-9 shrink-0 rounded-[5px]"
			/>
			<div className="flex min-w-[180px] flex-col gap-0.5">
				<span className="text-[15px] leading-tight font-medium text-ink">{game.title}</span>
				<span className="numeric text-[11px] text-faint">
					{game.minPlayers}–{game.maxPlayers} · {game.minutes}m · wt {game.weight.toFixed(1)} ·{" "}
					<span className="text-star">★</span> {game.rating.toFixed(1)}
				</span>
			</div>

			<ReasonChipList reasons={suggestion.reasons} limit={3} className="flex-1" />

			<div className="ml-auto flex items-center gap-3">
				<Meter
					value={suggestion.match}
					size="sm"
					tone={warn ? "warn" : "primary"}
					className="w-16"
				/>
				<Score value={suggestion.match} size="sm" warn={warn} />
				{isHost && (
					<Button variant="subtle" size="sm" disabled={picking} onClick={onPick}>
						Pick
					</Button>
				)}
			</div>
		</div>
	);
}
