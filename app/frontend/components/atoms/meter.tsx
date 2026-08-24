import { cn } from "@/lib/utils";

/**
 * Meter — the confidence / match bar under a ranked game.
 *
 * The fill width is data-driven but the design must stay 100% className, so
 * the value is quantised to 5% steps and mapped to a *literal* Tailwind width
 * class (Tailwind's JIT only sees literal strings, so `w-[94%]` must appear in
 * source). 5% granularity is imperceptible on a 64–520px bar.
 */
const widthStep: Record<number, string> = {
	0: "w-[0%]",
	5: "w-[5%]",
	10: "w-[10%]",
	15: "w-[15%]",
	20: "w-[20%]",
	25: "w-[25%]",
	30: "w-[30%]",
	35: "w-[35%]",
	40: "w-[40%]",
	45: "w-[45%]",
	50: "w-[50%]",
	55: "w-[55%]",
	60: "w-[60%]",
	65: "w-[65%]",
	70: "w-[70%]",
	75: "w-[75%]",
	80: "w-[80%]",
	85: "w-[85%]",
	90: "w-[90%]",
	95: "w-[95%]",
	100: "w-[100%]",
};

export function widthClassFor(value: number): string {
	const clamped = Math.max(0, Math.min(100, value));
	const step = Math.round(clamped / 5) * 5;
	return widthStep[step];
}

export function Meter({
	value,
	tone = "primary",
	size = "md",
	label = "Match score",
	className,
}: {
	value: number;
	tone?: "primary" | "warn" | "bad";
	size?: "sm" | "md";
	label?: string;
	className?: string;
}) {
	const fill = tone === "warn" ? "bg-accent" : tone === "bad" ? "bg-bad" : "bg-primary";
	return (
		<div
			role="progressbar"
			aria-valuenow={Math.round(value)}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label={label}
			className={cn(
				"flex overflow-hidden rounded-pill bg-line-soft",
				size === "sm" ? "h-1.5" : "h-[7px]",
				className,
			)}
		>
			<div className={cn("h-full rounded-pill", fill, widthClassFor(value))} />
		</div>
	);
}
