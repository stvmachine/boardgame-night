import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Card — the paper surface. shadcn-shaped slots (Card / CardHeader /
 * CardTitle / CardContent / CardFooter) with Felt & Ink tones:
 *   paper    raised warm-white surface with a soft 2px underlight
 *   inset    flat inset panel (f2eee2)
 *   ink      the dark "instrument" panel (tonight's table, hero device)
 *   ghost    dashed empty-state frame
 *   picked   green-bordered highlight (selected / next-up)
 */
const cardVariants = cva("rounded-card border", {
	variants: {
		tone: {
			paper: "border-line bg-surface shadow-card",
			inset: "border-line bg-inset",
			surface2: "border-line bg-surface-2",
			contrast: "border-contrast-line bg-contrast text-on-contrast",
			ghost: "border-dashed border-line bg-surface",
			picked: "border-good/40 bg-surface shadow-lift",
		},
		interactive: {
			true: "lift hover:shadow-lift",
			false: "",
		},
	},
	defaultVariants: { tone: "paper", interactive: false },
});

export type CardProps = React.ComponentProps<"div"> & VariantProps<typeof cardVariants>;

export function Card({ className, tone, interactive, ...props }: CardProps) {
	return (
		<div
			data-slot="card"
			className={cn(cardVariants({ tone, interactive }), className)}
			{...props}
		/>
	);
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div data-slot="card-header" className={cn("flex flex-col gap-1 p-4", className)} {...props} />
	);
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
	return <h3 data-slot="card-title" className={cn("text-h3", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
	return <div data-slot="card-content" className={cn("p-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="card-footer"
			className={cn("flex items-center gap-2 p-4 pt-0", className)}
			{...props}
		/>
	);
}

export { cardVariants };
