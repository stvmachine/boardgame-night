import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/components/atoms/avatar";
import { StarRating } from "@/components/atoms/star-rating";

/**
 * GameCover — box art with a *strong* fallback (hard constraint #6: never a
 * raw broken-image glyph). Real covers on BGG are often missing or slow, so:
 *   - no url / broken url  → a felt-weave panel with the title's initials
 *   - loading              → shimmering skeleton weave
 *   - error state          → clay-tinted "bgg data unavailable" with Retry
 * A gold rating badge sits top-right; an optional rank badge top-left.
 */
type CoverState = "default" | "loading" | "error";

export function GameCover({
	title,
	cover,
	rating,
	rank,
	state = "default",
	className,
	onRetry,
	children,
}: {
	title: string;
	cover?: string | null;
	rating?: number | null;
	rank?: number;
	state?: CoverState;
	className?: string;
	onRetry?: () => void;
	children?: React.ReactNode;
}) {
	const [broken, setBroken] = useState(false);
	const showImage = state === "default" && cover && !broken;

	return (
		<div
			className={cn(
				"relative flex items-end overflow-hidden bg-inset",
				state !== "error" && "cover-weave",
				className,
			)}
		>
			{showImage && (
				<img
					src={cover ?? undefined}
					alt={`${title} box cover`}
					loading="lazy"
					onError={() => setBroken(true)}
					className="absolute inset-0 size-full object-cover"
				/>
			)}

			{state === "loading" && <div className="skeleton absolute inset-0" />}

			{state === "default" && (!cover || broken) && (
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-inset">
					<span className="font-display text-3xl font-extrabold text-faint/70">
						{initialsOf(title)}
					</span>
					<span className="numeric text-[9px] text-faint">no cover on BGG</span>
				</div>
			)}

			{state === "error" && (
				<div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-bad-bg">
					<AlertTriangle className="size-5 text-bad" aria-hidden="true" />
					<span className="numeric text-[9px] text-bad">bgg data unavailable</span>
					{onRetry && (
						<button
							type="button"
							onClick={onRetry}
							className="text-xs text-bad underline underline-offset-2"
						>
							Retry
						</button>
					)}
				</div>
			)}

			{rank !== undefined && (
				<span className="numeric absolute top-2 left-2 rounded-[5px] bg-contrast px-1.5 py-0.5 text-[11px] font-bold text-on-contrast">
					#{rank}
				</span>
			)}

			{rating != null && state !== "error" && (
				<span className="numeric absolute top-2 right-2 rounded-[5px] bg-contrast px-1.5 py-0.5 text-[11px] font-bold text-on-contrast">
					<StarRating value={rating} className="text-on-contrast" />
				</span>
			)}

			{children}
		</div>
	);
}
