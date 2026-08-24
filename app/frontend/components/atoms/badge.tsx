import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge — small labelled token. Neutral by default; tones borrow the status
 * palette. For session lifecycle states use <StatusPill>; for suggestion
 * reasons use <ReasonChip>.
 */
const badgeVariants = cva(
	"inline-flex items-center gap-1 rounded-chip border px-2 py-0.5 text-xs font-medium",
	{
		variants: {
			tone: {
				neutral: "border-line bg-inset text-ink-2",
				good: "border-good/25 bg-good-bg text-good",
				warn: "border-warn/25 bg-warn-bg text-warn",
				bad: "border-bad/25 bg-bad-bg text-bad",
				info: "border-info/25 bg-info-bg text-info",
				ink: "border-ink bg-ink text-surface-2",
				primary: "border-primary/25 bg-primary/10 text-primary",
			},
		},
		defaultVariants: { tone: "neutral" },
	},
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
	return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
