import { cn } from "@/lib/utils";

/**
 * StepCard — one panel in the landing "how it works" tour. A mono step number,
 * a mono timing tag, a visual well, then a display title + copy. The final
 * "payoff" step inverts to the ink panel.
 */
export function StepCard({
	step,
	timing,
	title,
	children,
	visual,
	payoff = false,
	className,
}: {
	step: string;
	timing?: string;
	title: string;
	children: React.ReactNode;
	visual?: React.ReactNode;
	payoff?: boolean;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex flex-col gap-3 rounded-card border p-4",
				payoff ? "border-contrast-line bg-contrast text-on-contrast" : "border-line bg-surface",
				className,
			)}
		>
			<div className="flex items-center justify-between">
				<span
					className={cn(
						"numeric rounded-[5px] px-2 py-0.5 text-[11px] font-bold",
						payoff ? "bg-primary text-primary-fg" : "bg-ink text-surface-2",
					)}
				>
					{step}
				</span>
				{timing && (
					<span className={cn("numeric text-[10px]", payoff ? "text-muted" : "text-faint")}>
						{timing}
					</span>
				)}
			</div>
			{visual && (
				<div
					className={cn(
						"flex h-20 items-center justify-center overflow-hidden rounded-md border",
						payoff ? "border-contrast-line bg-contrast-2" : "border-line-soft bg-inset",
					)}
				>
					{visual}
				</div>
			)}
			<span className="font-display text-[17px] font-bold">{title}</span>
			<span
				className={cn("text-sm leading-relaxed", payoff ? "text-on-contrast-muted" : "text-muted")}
			>
				{children}
			</span>
		</div>
	);
}
