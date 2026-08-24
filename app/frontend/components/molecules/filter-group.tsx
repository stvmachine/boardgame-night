import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/atoms/eyebrow";

/**
 * FilterGroup — a labelled block inside the filter control panel. The label is
 * a mono micro-cap; `value` shows the current selection (e.g. "2–4") on the
 * right. Sits on the dark contrast panel, so it uses on-contrast text.
 */
export function FilterGroup({
	label,
	value,
	children,
	className,
}: {
	label: string;
	value?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col gap-2.5", className)}>
			<div className="flex items-baseline justify-between">
				<Eyebrow className="text-on-contrast-faint">{label}</Eyebrow>
				{value !== undefined && (
					<span className="numeric text-[13px] font-bold text-on-contrast">{value}</span>
				)}
			</div>
			{children}
		</div>
	);
}
