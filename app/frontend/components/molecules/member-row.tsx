import { Avatar, type AvatarTone } from "@/components/atoms/avatar";
import { cn } from "@/lib/utils";

/**
 * MemberRow — a member line: colour disc, name, mono sub-line (@handle · N
 * games), and a trailing slot for a role tag (OWNER / MEMBER) or an RSVP
 * marker (GOING).
 */
export function MemberRow({
	name,
	sub,
	seed,
	tone,
	trailing,
	className,
}: {
	name: string;
	sub?: string;
	seed?: string;
	tone?: AvatarTone;
	trailing?: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("flex items-center gap-2.5", className)}>
			<Avatar name={name} seed={seed} tone={tone} size="md" />
			<div className="flex min-w-0 flex-col">
				<span className="truncate text-sm font-medium text-current">{name}</span>
				{sub && <span className="numeric truncate text-[11px] text-faint">{sub}</span>}
			</div>
			{trailing && <div className="ml-auto shrink-0">{trailing}</div>}
		</div>
	);
}
