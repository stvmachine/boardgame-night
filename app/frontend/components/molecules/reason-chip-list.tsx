import { useState } from "react";
import { ReasonChip, type ReasonTone } from "@/components/atoms/reason-chip";
import { cn } from "@/lib/utils";

export type Reason = { ok: boolean; label: string };

/**
 * Infer a reason's visual tone from its content. The API only gives us
 * `{ ok, label }`, but the design distinguishes positive fits (green),
 * community "best at N" votes (amber), penalties (red) and plain facts.
 */
export function toneForReason(reason: Reason): ReasonTone {
	const label = reason.label.toLowerCase();
	if (/best at|vote|★|community/.test(label)) return "vote";
	if (!reason.ok) return "penalty";
	if (/✓|fits|budget|player|time/.test(label)) return "good";
	return "neutral";
}

/** Add the tone glyph the design uses (✓ / ★) if the label lacks one. */
function withGlyph(reason: Reason, tone: ReasonTone): string {
	if (/^[✓★]/.test(reason.label.trim())) return reason.label;
	if (tone === "good") return `✓ ${reason.label}`;
	if (tone === "vote") return `★ ${reason.label}`;
	return reason.label;
}

/**
 * ReasonChipList — the scannable "why this ranks" row. Shows the first `limit`
 * reasons, then a dashed "+N more reasons" toggle that expands the rest.
 */
export function ReasonChipList({
	reasons,
	limit = 4,
	className,
}: {
	reasons: Reason[];
	limit?: number;
	className?: string;
}) {
	const [expanded, setExpanded] = useState(false);
	const visible = expanded ? reasons : reasons.slice(0, limit);
	const hidden = reasons.length - visible.length;

	return (
		<ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Match reasons">
			{visible.map((reason, i) => {
				const tone = toneForReason(reason);
				return (
					<li key={`${reason.label}-${i}`}>
						<ReasonChip tone={tone}>{withGlyph(reason, tone)}</ReasonChip>
					</li>
				);
			})}
			{(hidden > 0 || expanded) && reasons.length > limit && (
				<li>
					<button
						type="button"
						data-testid="show-more-reasons"
						aria-expanded={expanded}
						onClick={() => setExpanded((v) => !v)}
					>
						<ReasonChip tone="more" className="cursor-pointer">
							{expanded ? "Show fewer" : `+${hidden} more reasons`}
						</ReasonChip>
					</button>
				</li>
			)}
		</ul>
	);
}
