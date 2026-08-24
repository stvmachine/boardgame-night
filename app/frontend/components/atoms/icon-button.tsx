import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * IconButton — a square paper control for chrome affordances (theme toggle,
 * search trigger). Quiet by default; `solid` for the felt-green variant.
 */
export function IconButton({
	solid = false,
	className,
	children,
	...props
}: React.ComponentProps<"button"> & { solid?: boolean }) {
	return (
		<button
			type="button"
			data-slot="icon-button"
			className={cn(
				"press inline-flex size-8 items-center justify-center rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface [&_svg]:size-[1.05rem]",
				solid
					? "bg-primary text-primary-fg hover:brightness-95"
					: "border border-line bg-surface text-ink-2 hover:bg-inset",
				className,
			)}
			{...props}
		>
			{children}
		</button>
	);
}
