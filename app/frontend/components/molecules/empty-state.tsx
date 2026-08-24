import { cn } from "@/lib/utils";

/**
 * EmptyState — an intentional first-run moment, not a void. Optional `visual`
 * (e.g. the fanned game-card stack for empty play history) sits left of the
 * copy; actions stack on the right.
 */
export function EmptyState({
	visual,
	title,
	description,
	actions,
	layout = "row",
	className,
}: {
	visual?: React.ReactNode;
	title: string;
	description: string;
	actions?: React.ReactNode;
	layout?: "row" | "center";
	className?: string;
}) {
	if (layout === "center") {
		return (
			<div
				className={cn(
					"flex flex-col items-center gap-4 rounded-card border border-dashed border-line bg-surface px-6 py-14 text-center",
					className,
				)}
			>
				{visual}
				<div className="flex max-w-sm flex-col gap-1.5">
					<h3 className="font-display text-xl font-bold text-ink">{title}</h3>
					<p className="text-sm leading-relaxed text-muted">{description}</p>
				</div>
				{actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
			</div>
		);
	}

	return (
		<div
			className={cn(
				"flex flex-col items-center gap-6 rounded-card border border-line bg-surface p-7 sm:flex-row",
				className,
			)}
		>
			{visual}
			<div className="flex max-w-md flex-col gap-1.5">
				<h3 className="font-display text-xl font-bold text-ink">{title}</h3>
				<p className="text-sm leading-relaxed text-muted">{description}</p>
			</div>
			{actions && <div className="flex flex-col gap-2 sm:ml-auto sm:shrink-0">{actions}</div>}
		</div>
	);
}

/**
 * FannedCovers — three overlapping felt-weave cards used as the empty
 * play-history visual (a suggestive "your shelf, waiting").
 */
export function FannedCovers() {
	return (
		<div className="flex shrink-0 items-center" aria-hidden="true">
			<div className="h-[72px] w-14 -rotate-[8deg] rounded-lg border border-line cover-weave" />
			<div className="-ml-3.5 h-[72px] w-14 rounded-lg border border-line cover-weave" />
			<div className="-ml-3.5 h-[72px] w-14 rotate-[8deg] rounded-lg border border-line cover-weave" />
		</div>
	);
}
