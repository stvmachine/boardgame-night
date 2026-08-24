import { cn } from "@/lib/utils";

/**
 * Separator — a hairline. `soft` on ink panels uses the raised line.
 */
export function Separator({
	orientation = "horizontal",
	soft = false,
	className,
}: {
	orientation?: "horizontal" | "vertical";
	soft?: boolean;
	className?: string;
}) {
	return (
		<div
			role="separator"
			aria-orientation={orientation}
			className={cn(
				soft ? "bg-line-soft" : "bg-line",
				orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
				className,
			)}
		/>
	);
}
