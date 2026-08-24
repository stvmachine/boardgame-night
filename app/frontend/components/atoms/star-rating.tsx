import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StarRating — a BGG rating as a gold star + mono number. `withMax` appends
 * the /10 denominator (used on the ranked hero cover). `unrated` renders the
 * honest "not rated yet" for hot games.
 */
export function StarRating({
	value,
	withMax = false,
	className,
}: {
	value: number | null | undefined;
	withMax?: boolean;
	className?: string;
}) {
	if (value == null || Number.isNaN(value)) {
		return <span className={cn("numeric text-[11px] text-faint", className)}>not rated yet</span>;
	}
	return (
		<span className={cn("numeric inline-flex items-center gap-1 text-ink", className)}>
			<Star className="size-3 fill-star text-star" aria-hidden="true" />
			{value.toFixed(1)}
			{withMax && <span className="text-faint">/10</span>}
		</span>
	);
}
