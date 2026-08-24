import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — the Felt & Ink action atom.
 * Felt-green primary, ink slab for the decisive "pick" action, quiet paper
 * outline/ghost for secondary actions. 120ms press scale via `.press`.
 */
const buttonVariants = cva(
	"press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-base font-medium outline-none disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface cursor-pointer",
	{
		variants: {
			variant: {
				primary: "bg-primary text-primary-fg hover:brightness-95",
				ink: "bg-ink text-surface-2 hover:bg-primary",
				outline: "border border-line bg-surface text-ink hover:bg-inset",
				subtle: "bg-surface-2 text-ink hover:bg-inset",
				ghost: "text-ink-2 hover:bg-inset",
				accent: "bg-accent text-ink hover:brightness-95",
				destructive: "bg-bad text-primary-fg hover:brightness-95",
				link: "text-primary underline-offset-4 hover:underline px-0",
			},
			size: {
				sm: "h-8 px-3 text-sm",
				default: "h-10 px-4",
				lg: "h-12 px-6 text-lg",
				pill: "h-9 rounded-pill px-4",
				icon: "size-8 p-0 [&_svg]:size-[1.05rem]",
				"icon-lg": "size-10 p-0",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "default",
		},
	},
);

export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
	return (
		<button
			data-slot="button"
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { buttonVariants };
