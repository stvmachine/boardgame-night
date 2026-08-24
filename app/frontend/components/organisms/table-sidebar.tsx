import { Card } from "@/components/atoms/card";
import { Eyebrow } from "@/components/atoms/eyebrow";
import { StatRow } from "@/components/atoms/stat";
import { Separator } from "@/components/atoms/separator";
import { Avatar } from "@/components/atoms/avatar";
import { Button } from "@/components/atoms/button";
import { ScoreBreakdown } from "@/components/molecules/score-breakdown";
import { cn } from "@/lib/utils";

export type TableAttendee = {
	id: string;
	name: string;
	seed?: string;
	host?: boolean;
	going?: boolean;
};

/**
 * TableSidebar — the constraints instrument for the night. A dark contrast
 * panel states the table (players / time / complexity), then lists who's at
 * it, with an invite affordance; a ScoreBreakdown explains the numbers.
 */
export function TableSidebar({
	players,
	timeBudget,
	complexity,
	attendees,
	onInvite,
	className,
}: {
	players: React.ReactNode;
	timeBudget: React.ReactNode;
	complexity: React.ReactNode;
	attendees: TableAttendee[];
	onInvite?: () => void;
	className?: string;
}) {
	return (
		<div className={cn("flex flex-col gap-3.5", className)}>
			<Card tone="contrast" className="flex flex-col gap-3.5 p-4">
				<Eyebrow className="text-on-contrast-faint">Tonight&apos;s table</Eyebrow>
				<div className="flex flex-col gap-2.5">
					<StatRow label="Players" value={players} />
					<StatRow label="Time budget" value={timeBudget} />
					<StatRow label="Complexity" value={complexity} />
				</div>
				<Separator className="bg-contrast-line" />
				<ul className="flex flex-col gap-2.5">
					{attendees.map((a) => (
						<li key={a.id} className="flex items-center gap-2.5">
							<Avatar name={a.name} seed={a.seed ?? a.id} size="md" />
							<span className="text-[13px] text-on-contrast">
								{a.name}
								{a.host && <span className="text-on-contrast-faint"> · host</span>}
							</span>
							{a.going && (
								<span className="numeric ml-auto text-[10px] font-bold text-on-contrast-good">
									GOING
								</span>
							)}
						</li>
					))}
				</ul>
				{onInvite && (
					<Button
						variant="outline"
						className="border-transparent bg-surface text-ink hover:brightness-95"
						onClick={onInvite}
					>
						Invite one more
					</Button>
				)}
			</Card>

			<ScoreBreakdown />
		</div>
	);
}
