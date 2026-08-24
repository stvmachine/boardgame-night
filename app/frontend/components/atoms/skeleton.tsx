import { cn } from "@/lib/utils";

/**
 * Skeleton — a shimmering paper block; shimmer becomes a static tint under
 * prefers-reduced-motion (handled in styles.css `.skeleton`).
 */
export function Skeleton({ className }: { className?: string }) {
	return <div aria-hidden="true" className={cn("skeleton rounded-md", className)} />;
}
