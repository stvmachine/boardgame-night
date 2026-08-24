import { cn } from "@/lib/utils";
import { DateChip } from "./date-chip";

/**
 * SessionRow — an upcoming night in the group hub. Composes a DateChip, a
 * title + status pill, a meta line, and a trailing action zone (going count +
 * button). `highlight` gives the live "picking" night a green frame + lift;
 * `draft` renders the quiet dashed no-date state.
 */
export function SessionRow({
	month,
	day,
	title,
	status,
	meta,
	trailing,
	highlight = false,
	draft = false,
	className,
}: {
	month?: string;
	day?: string | number;
	title: React.ReactNode;
	status?: React.ReactNode;
	meta?: React.ReactNode;
	trailing?: React.ReactNode;
	highlight?: boolean;
	draft?: boolean;
	className?: string;
}) {
	return (
		<div
			data-testid="session-row"
			className={cn(
				"flex items-center gap-4 rounded-card border p-4",
				highlight
					? "border-good/40 bg-surface shadow-lift"
					: draft
						? "border-dashed border-line bg-surface"
						: "border-line bg-surface",
				className,
			)}
		>
			<DateChip month={month} day={day} tone={highlight ? "primary" : draft ? "tbd" : "inset"} />
			<div className="flex min-w-0 flex-col gap-1">
				<div className="flex flex-wrap items-center gap-2.5">
					<span
						className={cn(
							"font-medium",
							highlight ? "font-display text-lg font-bold" : "text-base",
							draft && "text-ink-2",
						)}
					>
						{title}
					</span>
					{status}
				</div>
				{meta && <span className="text-sm text-muted">{meta}</span>}
			</div>
			{trailing && <div className="ml-auto flex shrink-0 items-center gap-3.5">{trailing}</div>}
		</div>
	);
}
