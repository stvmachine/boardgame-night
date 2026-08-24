import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Stat — a mono metric: a big tabular number over a wide-tracked micro-cap
 * label. Used in the group header (32 games / 2 members / 3 nights) and the
 * "tonight's table" panel (Players / Time budget / Complexity).
 */
export function Stat({
	value,
	label,
	align = "start",
	size = "md",
	className,
}: {
	value: React.ReactNode;
	label: string;
	align?: "start" | "end";
	size?: "md" | "lg";
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-0.5",
				align === "end" ? "items-end text-right" : "items-start",
				className,
			)}
		>
			<span
				className={cn("numeric leading-none font-bold", size === "lg" ? "text-[26px]" : "text-xl")}
			>
				{value}
			</span>
			<span className="numeric text-[10px] tracking-[0.12em] text-muted uppercase">{label}</span>
		</div>
	);
}

/**
 * StatRow — a label/value pair on one line (inside the ink table panel).
 */
export function StatRow({
	label,
	value,
	className,
}: {
	label: string;
	value: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex items-baseline justify-between", className)}>
			{/* current-color + opacity so the row adapts to paper or ink panels */}
			<span className="text-sm text-current opacity-70">{label}</span>
			<span className="numeric text-xl font-bold">{value}</span>
		</div>
	);
}
