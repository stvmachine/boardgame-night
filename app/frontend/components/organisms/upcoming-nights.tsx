import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, LinkButton, StatusPill } from "@/components/atoms";
import { EmptyState, SessionRow } from "@/components/molecules";
import type { GetGroupQuery, SessionState } from "@/generated/operations";

type Group = NonNullable<GetGroupQuery["group"]>;
type GroupSession = Group["sessions"][number];

function formatSessionDate(value: unknown) {
	if (!value) return null;
	const date = new Date(String(value));
	if (Number.isNaN(date.getTime())) return null;
	return {
		month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
		day: date.toLocaleDateString("en-US", { day: "numeric" }),
		time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
	};
}

function UpcomingSessionRow({ session }: { session: GroupSession }) {
	const navigate = useNavigate();
	const goToSession = useCallback(() => navigate(`/s/${session.id}`), [navigate, session.id]);
	const date = formatSessionDate(session.scheduledAt);
	const isDraft = session.state === "DRAFT" || !date;
	const isPicking = session.state === "PICKING";

	const meta = isDraft
		? "No date yet — pick one and we'll invite the crew"
		: date
			? `${date.time}${session.location && session.location.toUpperCase() !== "TBD" ? ` · ${session.location}` : ""}`
			: session.location && session.location.toUpperCase() !== "TBD"
				? session.location
				: "Schedule to be decided";

	if (isDraft) {
		return (
			<SessionRow
				draft
				title={session.title}
				status={<StatusPill state="DRAFT" />}
				meta={meta}
				trailing={
					<Button variant="outline" size="sm" onClick={goToSession}>
						Set a date
					</Button>
				}
			/>
		);
	}

	return (
		<SessionRow
			highlight={isPicking}
			month={date?.month}
			day={date?.day}
			title={session.title}
			status={<StatusPill state={session.state as SessionState} dot={isPicking} />}
			meta={meta}
			trailing={
				<>
					<span className="numeric text-xs text-ink-2">{session.attendeeCount} going</span>
					<Button variant={isPicking ? "ink" : "outline"} size="sm" onClick={goToSession}>
						{isPicking ? "Choose a game" : "View details"}
					</Button>
				</>
			}
		/>
	);
}

/**
 * UpcomingNights — the group's scheduled sessions: a section title with a
 * "View all sessions" link, then a stack of SessionRows (live PICKING night
 * highlighted, drafts rendered as the quiet dashed no-date state).
 */
export function UpcomingNights({
	group,
	canManage,
	onCreate,
	creating,
}: {
	group: Group;
	canManage: boolean;
	onCreate: () => void;
	creating: boolean;
}) {
	const token = group.inviteCode ?? group.id;

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-baseline justify-between gap-4">
				<h2 className="font-display text-lg font-bold text-ink">Upcoming nights</h2>
				<LinkButton to={`/g/${token}/sessions`} variant="link" size="sm">
					View all sessions
				</LinkButton>
			</div>

			{group.sessions.length > 0 ? (
				<div className="flex flex-col gap-3">
					{group.sessions.map((session) => (
						<UpcomingSessionRow key={session.id} session={session} />
					))}
				</div>
			) : (
				<EmptyState
					layout="center"
					title={canManage ? "Plan your first game night" : "No nights planned yet"}
					description={
						canManage
							? "Create a night to get everyone on the schedule."
							: "Check back later for upcoming game nights."
					}
					actions={
						canManage ? (
							<Button onClick={onCreate} disabled={creating}>
								{creating ? "Creating…" : "Create a night"}
							</Button>
						) : undefined
					}
				/>
			)}
		</section>
	);
}
