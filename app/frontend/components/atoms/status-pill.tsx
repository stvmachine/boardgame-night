import { cn } from "@/lib/utils";
import type { SessionState } from "@/lib/data";

/**
 * StatusPill — session lifecycle state as a mono, uppercase, pill.
 * PICKING (amber) · INVITED (info) · COMPLETED (green) · CANCELLED (red) ·
 * DRAFT / IN_PROGRESS (neutral/green). Optional pulse dot for live states.
 */
const stateStyles: Record<SessionState, string> = {
	DRAFT: "border-line bg-inset text-muted",
	INVITED: "border-info/25 bg-info-bg text-info",
	PICKING: "border-warn/25 bg-warn-bg text-warn",
	IN_PROGRESS: "border-good/25 bg-good-bg text-good",
	COMPLETED: "border-good/25 bg-good-bg text-good",
	CANCELLED: "border-bad/25 bg-bad-bg text-bad",
};

const dotStyles: Record<SessionState, string> = {
	DRAFT: "bg-faint",
	INVITED: "bg-info",
	PICKING: "bg-accent",
	IN_PROGRESS: "bg-primary",
	COMPLETED: "bg-good",
	CANCELLED: "bg-bad",
};

export function StatusPill({
	state,
	dot = false,
	className,
}: {
	state: SessionState;
	dot?: boolean;
	className?: string;
}) {
	return (
		<span
			data-slot="status-pill"
			className={cn(
				"numeric inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-[11px] font-bold tracking-[0.08em] uppercase",
				stateStyles[state],
				className,
			)}
		>
			{dot && <span aria-hidden="true" className={cn("size-1.5 rounded-pill", dotStyles[state])} />}
			{state.replace("_", " ")}
		</span>
	);
}
