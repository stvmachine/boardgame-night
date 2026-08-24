import { Link } from "react-router-dom";
import type { SessionState } from "@/lib/data";
import { StatusPill } from "@/components/atoms/status-pill";
import { cn } from "@/lib/utils";

/**
 * SessionHeader — the night's masthead: a mono breadcrumb, the display title +
 * a live status pill, a facts line (date · place · host), and a right-aligned
 * actions slot (edit constraints / share).
 */
export function SessionHeader({
	title,
	state,
	breadcrumb,
	breadcrumbHref,
	dateText,
	location,
	hostName,
	actions,
	className,
}: {
	title: string;
	state: SessionState;
	breadcrumb?: string;
	breadcrumbHref?: string;
	dateText?: string | null;
	location?: string | null;
	hostName?: string;
	actions?: React.ReactNode;
	className?: string;
}) {
	const live = state === "PICKING" || state === "IN_PROGRESS";
	const facts = [
		dateText,
		location,
		hostName ? (
			<>
				Hosted by <span className="font-medium text-ink">{hostName}</span>
			</>
		) : null,
	].filter(Boolean);

	return (
		<div className={cn("flex flex-wrap items-end gap-6", className)}>
			<div className="flex min-w-0 flex-col gap-2">
				{breadcrumb && (
					<nav className="numeric flex items-center gap-2 text-[11px] tracking-[0.14em] text-muted uppercase">
						{breadcrumbHref ? (
							<Link to={breadcrumbHref} className="text-muted hover:text-ink">
								{breadcrumb}
							</Link>
						) : (
							<span>{breadcrumb}</span>
						)}
						<span>/</span>
						<span className="text-ink-2">Tonight</span>
					</nav>
				)}
				<div className="flex flex-wrap items-center gap-3.5">
					<h1 className="text-h1 text-ink">{title}</h1>
					<StatusPill state={state} dot={live} />
				</div>
				{facts.length > 0 && (
					<p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-2">
						{facts.map((f, i) => (
							<span key={i} className="flex items-center gap-3">
								{i > 0 && <span className="text-line-soft">·</span>}
								<span>{f}</span>
							</span>
						))}
					</p>
				)}
			</div>
			{actions && <div className="ml-auto flex flex-wrap gap-2.5">{actions}</div>}
		</div>
	);
}
