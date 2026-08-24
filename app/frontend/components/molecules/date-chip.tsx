import { cn } from "@/lib/utils";

/**
 * DateChip — the MON / DD calendar tile that anchors an upcoming night.
 *   primary → the live next-up night (felt-green)
 *   inset   → a scheduled night (quiet paper)
 *   tbd     → no date yet (dashed)
 */
export function DateChip({
	month,
	day,
	tone = "inset",
	className,
}: {
	month?: string;
	day?: string | number;
	tone?: "primary" | "inset" | "tbd";
	className?: string;
}) {
	if (tone === "tbd") {
		return (
			<div
				className={cn(
					"numeric flex size-[52px] shrink-0 items-center justify-center rounded-[10px] border border-dashed border-line bg-inset text-[10px] text-faint",
					className,
				)}
			>
				TBD
			</div>
		);
	}
	return (
		<div
			className={cn(
				"numeric flex shrink-0 flex-col items-center justify-center rounded-[10px]",
				tone === "primary"
					? "size-[58px] bg-primary text-primary-fg"
					: "size-[52px] border border-line bg-inset text-ink-2",
				className,
			)}
		>
			<span className="text-[10px] tracking-[0.1em] uppercase">{month}</span>
			<span
				className={cn("font-bold leading-none", tone === "primary" ? "text-[22px]" : "text-xl")}
			>
				{day}
			</span>
		</div>
	);
}
