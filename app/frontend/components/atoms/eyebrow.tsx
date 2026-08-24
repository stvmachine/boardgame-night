import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Eyebrow — the mono, wide-tracked, uppercase kicker that labels a section
 * ("TONIGHT'S TABLE", "HOW SCORING WORKS"). Muted by default; `primary` for
 * hero eyebrows.
 */
export function Eyebrow({
	tone = "muted",
	className,
	...props
}: React.ComponentProps<"p"> & { tone?: "muted" | "primary" | "faint" }) {
	return (
		<p
			data-slot="eyebrow"
			className={cn(
				"numeric text-[10px] font-medium tracking-[0.14em] uppercase",
				tone === "primary" && "text-primary",
				tone === "muted" && "text-muted",
				tone === "faint" && "text-faint",
				className,
			)}
			{...props}
		/>
	);
}
