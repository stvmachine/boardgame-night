import { Link, type LinkProps } from "react-router-dom";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button";

/**
 * LinkButton — a react-router <Link> that wears the Button skin. Use for
 * navigations that should look like actions (Start free, Create a night, …).
 */
export type LinkButtonProps = LinkProps & VariantProps<typeof buttonVariants>;

export function LinkButton({ className, variant, size, ...props }: LinkButtonProps) {
	return (
		<Link
			data-slot="link-button"
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}
