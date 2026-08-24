import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * ReasonChip — the visual language for why a game ranks where it does.
 *   good    ✓ positive fit (fits players / time)      green
 *   vote    ★ community "best at N" vote               amber
 *   neutral   a plain fact (weight, never played)      paper
 *   penalty   a score penalty (heavier than asked)     red
 *   more      "+N more reasons" (dashed, ghost)        muted
 */
const reasonChipVariants = cva(
	"inline-flex items-center gap-1.5 rounded-chip border px-2.5 py-1 text-xs",
	{
		variants: {
			tone: {
				good: "border-good/25 bg-good-bg text-good",
				vote: "border-warn/25 bg-warn-bg text-warn",
				neutral: "border-line bg-inset text-ink-2",
				penalty: "border-bad/25 bg-bad-bg text-bad",
				more: "border border-dashed border-line bg-transparent text-muted",
			},
		},
		defaultVariants: { tone: "neutral" },
	},
);

export type ReasonTone = NonNullable<VariantProps<typeof reasonChipVariants>["tone"]>;

export type ReasonChipProps = React.ComponentProps<"span"> &
	VariantProps<typeof reasonChipVariants>;

export function ReasonChip({ className, tone, ...props }: ReasonChipProps) {
	return (
		<span
			data-slot="reason-chip"
			className={cn(reasonChipVariants({ tone }), className)}
			{...props}
		/>
	);
}

export { reasonChipVariants };
