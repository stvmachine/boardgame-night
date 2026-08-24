import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Chip — a selectable filter token (play-time buckets, mobile filter rail).
 * Active reads as a filled felt-green slab; inactive as a quiet paper pill.
 * Renders as a <button> so it is keyboard-operable.
 */
export function Chip({
	active = false,
	count,
	tone = "paper",
	className,
	children,
	...props
}: React.ComponentProps<"button"> & {
	active?: boolean;
	count?: number;
	tone?: "paper" | "contrast";
}) {
	const paper = tone === "paper";
	return (
		<button
			type="button"
			data-slot="chip"
			aria-pressed={active}
			className={cn(
				"press inline-flex items-center gap-1.5 rounded-pill border px-3 py-1.5 text-xs whitespace-nowrap",
				active
					? paper
						? "border-transparent bg-primary font-medium text-primary-fg"
						: "border-transparent bg-on-contrast-good font-medium text-contrast"
					: paper
						? "border-line bg-surface-2 text-ink-2 hover:bg-inset"
						: "border-contrast-line bg-contrast-2 text-on-contrast-muted hover:brightness-110",
				className,
			)}
			{...props}
		>
			{children}
			{count !== undefined && (
				<span
					className={cn(
						"numeric text-[11px]",
						active ? "opacity-75" : paper ? "text-faint" : "text-on-contrast-faint",
					)}
				>
					· {count}
				</span>
			)}
		</button>
	);
}
