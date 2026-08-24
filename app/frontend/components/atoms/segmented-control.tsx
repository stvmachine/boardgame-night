import { cn } from "@/lib/utils";

/**
 * SegmentedControl — a compact single-choice control. Used for complexity
 * (Any / Light / Medium / Heavy) and the grid/list view toggle. The active
 * segment reads as a raised light slab on an inset track.
 *
 * Two tones: `paper` (on light surfaces) and `ink` (inside the dark filter
 * panel), where the track is dark and the active slab is paper.
 */
export type Segment<T extends string> = { value: T; label: React.ReactNode };

export function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	tone = "paper",
	size = "md",
	className,
}: {
	options: Segment<T>[];
	value: T;
	onChange?: (value: T) => void;
	tone?: "paper" | "ink";
	size?: "sm" | "md";
	className?: string;
}) {
	return (
		<div
			role="tablist"
			className={cn(
				"inline-flex gap-0.5 rounded-md border p-0.5",
				tone === "ink" ? "border-contrast-line bg-contrast-2" : "border-line bg-surface",
				className,
			)}
		>
			{options.map((opt) => {
				const active = opt.value === value;
				return (
					<button
						key={opt.value}
						type="button"
						role="tab"
						aria-selected={active}
						onClick={() => onChange?.(opt.value)}
						className={cn(
							"press flex-1 rounded-[6px] text-center whitespace-nowrap",
							size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
							tone === "paper" && active && "bg-ink font-medium text-surface-2",
							tone === "paper" && !active && "text-ink-2 hover:bg-inset",
							tone === "ink" && active && "bg-on-contrast font-medium text-contrast",
							tone === "ink" && !active && "text-on-contrast-muted hover:brightness-110",
						)}
					>
						{opt.label}
					</button>
				);
			})}
		</div>
	);
}
