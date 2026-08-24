import { Avatar, type AvatarSize } from "@/components/atoms/avatar";
import { cn } from "@/lib/utils";

export type StackPerson = { id: string; name: string; seed?: string };

/**
 * AvatarStack — overlapping member discs with a +N overflow token. Each disc
 * carries a paper ring so they read as separated when they overlap.
 */
export function AvatarStack({
	people,
	max = 4,
	size = "sm",
	className,
}: {
	people: StackPerson[];
	max?: number;
	size?: AvatarSize;
	className?: string;
}) {
	const shown = people.slice(0, max);
	const rest = people.length - shown.length;
	return (
		<div className={cn("flex items-center", className)} aria-label={`${people.length} members`}>
			{shown.map((p) => (
				<Avatar
					key={p.id}
					name={p.name}
					seed={p.seed ?? p.id}
					size={size}
					ring
					className="-ml-1.5 first:ml-0"
				/>
			))}
			{rest > 0 && (
				<span className="numeric -ml-1.5 inline-flex size-6 items-center justify-center rounded-pill bg-inset text-[10px] font-bold text-ink-2 ring-2 ring-surface">
					+{rest}
				</span>
			)}
		</div>
	);
}
