import type { Game, Suggestion } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/atoms/button";
import { Meter } from "@/components/atoms/meter";
import { Score } from "@/components/atoms/score";
import { StarRating } from "@/components/atoms/star-rating";
import { GameCover } from "./game-cover";
import { ReasonChipList } from "./reason-chip-list";

function confidenceLabel(confidence: string) {
	const c = confidence.toUpperCase();
	if (c === "HIGH") return { text: "HIGH CONFIDENCE", tone: "text-primary" };
	if (c === "MEDIUM") return { text: "MEDIUM CONFIDENCE", tone: "text-warn" };
	if (c === "LOW") return { text: "LOW CONFIDENCE", tone: "text-muted" };
	return { text: `${c} CONFIDENCE`, tone: "text-ink-2" };
}

/**
 * RankedGameCard — the #1 pick, given the room. Cover + gold rating in a fixed
 * left column; the right column carries the rank, name, blurb, the big match
 * score, a confidence meter, the scannable reason chips, and the decisive
 * actions. This is the app's whole reason to exist, so it earns the space.
 */
export function RankedGameCard({
	game,
	suggestion,
	rank = 1,
	meta,
	subtitle,
	isHost = true,
	picking = false,
	pickError,
	selected = false,
	onPick,
	onWhy,
	className,
}: {
	game: Game;
	suggestion: Suggestion;
	rank?: number;
	meta?: string;
	subtitle?: string;
	isHost?: boolean;
	picking?: boolean;
	pickError?: string | null;
	selected?: boolean;
	onPick?: () => void;
	onWhy?: () => void;
	className?: string;
}) {
	const conf = confidenceLabel(suggestion.confidence);
	const warn = suggestion.match < 75;
	const metaLine =
		meta ??
		`${game.minPlayers}–${game.maxPlayers} players · ${game.minutes}m · wt ${game.weight.toFixed(1)}`;

	return (
		<article
			data-testid="ranked-game-card"
			className={cn(
				"flex flex-col gap-5 rounded-card border bg-surface p-5 sm:flex-row",
				selected ? "border-2 border-primary shadow-lift" : "border-line shadow-card",
				className,
			)}
		>
			<div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-[132px]">
				<GameCover
					title={game.title}
					cover={game.cover}
					className="aspect-[3/4] w-full rounded-md"
				/>
				<StarRating value={game.rating} withMax className="text-xs" />
			</div>

			<div className="flex min-w-0 flex-1 flex-col gap-3">
				<div className="flex items-start gap-3">
					<span className="numeric mt-1 shrink-0 rounded-[5px] bg-primary px-2 py-1 text-xs font-bold text-primary-fg">
						#{rank}
					</span>
					<div className="flex min-w-0 flex-col gap-1">
						<h3 className="font-display text-2xl leading-none font-bold tracking-[-0.02em] text-ink">
							{game.title}
						</h3>
						{(subtitle ?? game.description) && (
							<p className="text-[13px] text-muted">{subtitle ?? game.description}</p>
						)}
					</div>
					<Score
						value={suggestion.match}
						size="xl"
						warn={warn}
						showLabel
						className="ml-auto shrink-0"
					/>
				</div>

				<div className="flex flex-col gap-2.5">
					<div className="flex items-center gap-2.5">
						<Meter value={suggestion.match} tone={warn ? "warn" : "primary"} className="flex-1" />
						<span className={cn("numeric text-[11px] font-bold tracking-[0.06em]", conf.tone)}>
							{conf.text}
						</span>
					</div>
					<ReasonChipList reasons={suggestion.reasons} />
				</div>

				<div className="flex flex-wrap items-center gap-2.5 pt-1">
					{isHost ? (
						<Button variant="ink" size="sm" disabled={picking} onClick={onPick}>
							{picking ? "Picking…" : selected ? "Picked for tonight" : "Pick this game"}
						</Button>
					) : (
						<span className="text-sm text-muted">The host will choose the game.</span>
					)}
					{onWhy && (
						<Button variant="outline" size="sm" onClick={onWhy}>
							Why this ranks first
						</Button>
					)}
					<span className="numeric ml-auto text-[11px] text-faint">{metaLine}</span>
				</div>

				{pickError && (
					<p className="text-sm text-bad" role="alert">
						{pickError}
					</p>
				)}
			</div>
		</article>
	);
}
