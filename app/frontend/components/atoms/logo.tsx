import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Logo — a felt-green die tile + Bricolage wordmark. `mark` renders the tile
 * alone (mobile, tight headers).
 */
export function Logo({
	to = "/",
	mark = false,
	className,
}: {
	to?: string;
	mark?: boolean;
	className?: string;
}) {
	return (
		<Link
			to={to}
			className={cn("inline-flex items-center gap-2.5", className)}
			aria-label="BoardGameNight home"
		>
			<span className="numeric flex size-[26px] items-center justify-center rounded-[7px] bg-primary text-[13px] font-bold text-primary-fg">
				⚀
			</span>
			{!mark && (
				<span className="font-display text-base font-bold tracking-[-0.01em] text-ink">
					BoardGameNight
				</span>
			)}
		</Link>
	);
}
