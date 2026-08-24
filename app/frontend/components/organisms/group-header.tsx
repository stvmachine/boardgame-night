import { Plus } from "lucide-react";
import { Button } from "@/components/atoms";

/**
 * GroupHeader — the full-width contrast band that opens the group hub. Eyebrow
 * "Group", the display name + blurb, then right-aligned mono stats
 * (games / members / nights ahead) and the accent "Create a night" action.
 */
export function GroupHeader({
	name,
	description,
	gamesCount,
	membersCount,
	nightsAhead,
	canManage,
	onCreate,
	creating,
}: {
	name: string;
	description?: string | null;
	gamesCount: number;
	membersCount: number;
	nightsAhead: number;
	canManage: boolean;
	onCreate: () => void;
	creating: boolean;
}) {
	const stats: Array<{ value: number; label: string }> = [
		{ value: gamesCount, label: "games" },
		{ value: membersCount, label: "members" },
		{ value: nightsAhead, label: "nights ahead" },
	];

	return (
		<header className="flex flex-wrap items-end gap-6 rounded-card bg-contrast px-6 py-7 text-on-contrast sm:px-8">
			<div className="flex min-w-0 flex-col gap-2">
				<p className="numeric text-[10px] font-medium tracking-[0.14em] text-on-contrast-faint uppercase">
					Group
				</p>
				<h1 className="font-display text-h1 leading-none font-extrabold tracking-tight text-on-contrast">
					{name}
				</h1>
				{description ? (
					<p className="max-w-xl text-sm text-on-contrast-muted">{description}</p>
				) : null}
			</div>

			<div className="flex flex-wrap items-end gap-7 sm:ml-auto">
				{stats.map((stat) => (
					<div key={stat.label} className="flex flex-col gap-0.5">
						<span className="numeric text-[26px] leading-none font-bold text-on-contrast">
							{stat.value}
						</span>
						<span className="numeric text-[10px] tracking-[0.12em] text-on-contrast-faint uppercase">
							{stat.label}
						</span>
					</div>
				))}
				{canManage ? (
					<Button variant="accent" onClick={onCreate} disabled={creating}>
						<Plus aria-hidden="true" />
						{creating ? "Creating…" : "Create a night"}
					</Button>
				) : null}
			</div>
		</header>
	);
}
