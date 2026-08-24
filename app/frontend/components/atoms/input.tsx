import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input — a warm paper field. Quiet line border, felt-green focus ring.
 */
export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"h-11 w-full rounded-md border border-line bg-surface px-3.5 text-base text-ink placeholder:text-faint",
				"outline-none transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25",
				"disabled:opacity-60 file:border-0 file:bg-transparent file:text-sm",
				className,
			)}
			{...props}
		/>
	);
}
