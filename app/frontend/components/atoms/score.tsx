import { cn } from "@/lib/utils";

/**
 * Score — the big mono match number (0–100). Reads felt-green when the game
 * clears the bar, amber when it only partly fits (a penalty dragged it down).
 * The label sits beneath in mono micro-caps.
 */
const sizes = {
	sm: "text-[17px]",
	md: "text-2xl",
	lg: "text-3xl",
	xl: "text-[30px]",
} as const;

export function Score({
	value,
	size = "md",
	warn,
	showLabel = false,
	label = "match score",
	className,
}: {
	value: number;
	size?: keyof typeof sizes;
	/** Force amber; otherwise auto-amber below 75. */
	warn?: boolean;
	showLabel?: boolean;
	label?: string;
	className?: string;
}) {
	const isWarn = warn ?? value < 75;
	return (
		<div className={cn("flex flex-col items-end", className)}>
			<span
				className={cn(
					"numeric leading-none font-bold",
					sizes[size],
					isWarn ? "text-warn" : "text-primary",
				)}
			>
				{Math.round(value)}
			</span>
			{showLabel && (
				<span className="numeric text-[10px] tracking-[0.12em] text-muted uppercase">{label}</span>
			)}
		</div>
	);
}
