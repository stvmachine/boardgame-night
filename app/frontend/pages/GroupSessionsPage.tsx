import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { CalendarDays, ChevronLeft } from "lucide-react";
import { Card, LinkButton, Skeleton, StatusPill } from "@/components/atoms";
import { EmptyState, SessionRow } from "@/components/molecules";
import { useGetGroupQuery, type GetGroupQuery } from "@/generated/operations";

type Group = NonNullable<GetGroupQuery["group"]>;
type PastSession = Group["pastSessions"][number];

function formatSessionDate(value: unknown) {
	if (!value) return null;
	const date = new Date(String(value));
	if (Number.isNaN(date.getTime())) return null;
	return {
		month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
		day: date.toLocaleDateString("en-US", { day: "numeric" }),
		weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
		time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
	};
}

function PastSessionRow({ session }: { session: PastSession }) {
	const date = formatSessionDate(session.scheduledAt);
	const scheduleDetails = date
		? `${date.weekday}, ${date.time}${session.location ? ` · ${session.location}` : ""}`
		: session.location && session.location.toUpperCase() !== "TBD"
			? session.location
			: "Schedule to be decided";

	return (
		<li data-testid="session-row">
			<SessionRow
				month={date?.month}
				day={date?.day}
				draft={!date}
				title={session.title}
				status={<StatusPill state={session.state} />}
				meta={scheduleDetails}
				trailing={
					session.pickedGame ? (
						<span className="flex items-center gap-2.5">
							{session.pickedGame.thumbnail ? (
								<img
									src={session.pickedGame.thumbnail}
									alt={`${session.pickedGame.name} box cover`}
									className="size-11 rounded-md object-cover"
								/>
							) : (
								<span className="flex size-11 items-center justify-center rounded-md bg-inset text-[10px] text-faint">
									No image
								</span>
							)}
							<span className="hidden text-sm font-medium text-ink sm:inline">
								{session.pickedGame.name}
							</span>
						</span>
					) : undefined
				}
			/>
		</li>
	);
}

export function GroupSessionsPage() {
	const { token } = useParams<{ token: string }>();
	const { data, loading, error } = useGetGroupQuery({
		variables: { token: token ?? "" },
		skip: !token,
	});
	const group = data?.group ?? null;
	const pastSessions = useMemo(() => group?.pastSessions ?? [], [group]);
	const backToGroup = token ? `/g/${encodeURIComponent(token)}` : "/groups";

	if (loading) {
		return (
			<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6" aria-busy="true">
				<div className="mb-6 flex flex-col gap-4">
					<Skeleton className="h-4 w-32 rounded-full" />
					<Skeleton className="h-10 w-2/3 rounded-card" />
				</div>
				<div
					className="flex flex-col gap-3"
					role="progressbar"
					aria-label="Loading past sessions"
					aria-busy="true"
				>
					<Skeleton className="h-24 rounded-card" />
					<Skeleton className="h-24 rounded-card" />
				</div>
			</div>
		);
	}

	if (error || !group) {
		return (
			<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
				<Card className="flex flex-col items-center gap-3 p-12 text-center">
					<h2 className="text-h3 text-ink">
						{error ? "Couldn’t load this page" : "Group not found"}
					</h2>
					<p className="text-muted">
						{error
							? "Please check your connection and try again."
							: "This group doesn’t exist or you don’t have access to it."}
					</p>
					<LinkButton to={backToGroup} variant="outline" size="lg">
						Back to group
					</LinkButton>
				</Card>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
			<div className="mb-6 flex flex-col gap-2">
				<Link
					to={backToGroup}
					className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
				>
					<ChevronLeft className="size-4" aria-hidden="true" />
					Back to group
				</Link>
				<h1 className="text-h1 text-ink">{group.name}</h1>
				<h2 className="text-h3 text-ink-2">Past sessions</h2>
			</div>

			{pastSessions.length > 0 ? (
				<ul className="flex flex-col gap-3">
					{pastSessions.map((session) => (
						<PastSessionRow key={session.id} session={session} />
					))}
				</ul>
			) : (
				<EmptyState
					layout="center"
					visual={
						<span className="flex size-12 items-center justify-center rounded-md bg-inset text-muted">
							<CalendarDays className="size-5" aria-hidden="true" />
						</span>
					}
					title="No past sessions"
					description="Past game nights will show up here once you've wrapped a session."
					actions={
						<LinkButton to={backToGroup} variant="outline">
							Back to group
						</LinkButton>
					}
				/>
			)}
		</div>
	);
}
