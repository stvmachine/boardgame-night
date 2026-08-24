import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Pencil, Share2, X } from "lucide-react";
import {
	useGetNightSessionQuery,
	useScheduleSessionMutation,
	useStartPickingMutation,
	useUpdateSessionDetailsMutation,
	usePickGameMutation,
	type GetNightSessionQuery,
} from "@/generated/operations";
import { useAuth } from "@/contexts/AuthContext";
import { toGame, toSuggestion } from "@/lib/graphql/adapters";
import type { SessionState } from "@/lib/data";
import { Button } from "@/components/atoms/button";
import { LinkButton } from "@/components/atoms/link-button";
import { Card } from "@/components/atoms/card";
import { Eyebrow } from "@/components/atoms/eyebrow";
import { Meter } from "@/components/atoms/meter";
import { Skeleton } from "@/components/atoms/skeleton";
import { Field } from "@/components/molecules/field";
import { MemberRow } from "@/components/molecules/member-row";
import { GameCard } from "@/components/molecules/game-card";
import { EmptyState } from "@/components/molecules/empty-state";
import { SessionHeader } from "@/components/organisms/session-header";
import { RankedList, type RankedItem } from "@/components/organisms/ranked-list";
import { TableSidebar, type TableAttendee } from "@/components/organisms/table-sidebar";

type NightSession = NonNullable<GetNightSessionQuery["nightSession"]>;
type Attendance = NightSession["attendances"][number];

const Container = ({ children }: { children: React.ReactNode }) => (
	<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">{children}</div>
);

function formatSessionDate(value: unknown) {
	if (!value) return null;
	const date = new Date(String(value));
	if (Number.isNaN(date.getTime())) return null;
	const weekday = date.toLocaleDateString("en-US", { weekday: "short" });
	const month = date.toLocaleDateString("en-US", { month: "short" });
	const day = date.toLocaleDateString("en-US", { day: "numeric" });
	const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
	return `${weekday}, ${month} ${day} · ${time}`;
}

function toAttendees(attendances: Attendance[]): TableAttendee[] {
	return attendances.map((a) => ({
		id: a.user.id,
		name: a.user.displayName || a.user.username || "Member",
		seed: a.user.id,
		going: a.response === "going",
	}));
}

/* ─────────────────────────────── Page ─────────────────────────────── */

export function SessionPage() {
	const { id } = useParams<{ id: string }>();
	const { user, loading: authLoading } = useAuth();
	const { data, loading, error } = useGetNightSessionQuery({
		variables: { id: id ?? "" },
		skip: !id,
	});

	const session = data?.nightSession ?? null;
	const [displaySession, setDisplaySession] = useState<NightSession | null>(session);

	useEffect(() => {
		if (session) setDisplaySession(session);
	}, [session]);

	const isHost = Boolean(user && displaySession && user.id === displaySession.host.id);

	if (loading || authLoading) {
		return (
			<Container>
				<Skeleton className="h-24 w-full rounded-card" />
				<div className="grid gap-6 lg:grid-cols-[1fr_300px]">
					<Skeleton className="h-64 rounded-card" />
					<Skeleton className="h-64 rounded-card" />
				</div>
			</Container>
		);
	}

	if (error || !displaySession) {
		return (
			<div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
				<EmptyState
					layout="center"
					visual={
						<span className="flex size-12 items-center justify-center rounded-pill bg-inset text-muted">
							<AlertCircle className="size-5" />
						</span>
					}
					title="Session not found"
					description={
						error
							? "Please check your connection and try again."
							: "This session doesn’t exist or you don’t have access to it."
					}
					actions={
						<LinkButton to="/" variant="outline">
							Back home
						</LinkButton>
					}
				/>
			</div>
		);
	}

	const state = displaySession.state as SessionState;
	const dateText = formatSessionDate(displaySession.scheduledAt) ?? "Date TBD";

	return (
		<Container>
			<SessionHeader
				title={displaySession.title}
				state={state}
				breadcrumb={displaySession.host.displayName ? "This night" : undefined}
				dateText={dateText}
				location={displaySession.location || "Location TBD"}
				hostName={displaySession.host.displayName}
				actions={
					state === "PICKING" || state === "INVITED" ? (
						<>
							<SessionDetailsEditor
								session={displaySession}
								isHost={isHost}
								onUpdated={setDisplaySession}
							/>
							<ShareButton />
						</>
					) : null
				}
			/>

			{state === "DRAFT" && (
				<>
					<Card className="p-5">
						<h2 className="text-h2 mb-3 text-ink">Who&apos;s coming</h2>
						<AttendeeSummary attendances={displaySession.attendances} />
					</Card>
					<DraftScheduleForm
						session={displaySession}
						isHost={isHost}
						onScheduled={setDisplaySession}
					/>
				</>
			)}

			{state === "INVITED" && (
				<SessionRsvpCard session={displaySession} isHost={isHost} onStarted={setDisplaySession} />
			)}

			{state === "PICKING" && (
				<PickingView session={displaySession} isHost={isHost} onPicked={setDisplaySession} />
			)}

			{(state === "COMPLETED" || state === "CANCELLED") && (
				<CompletedView session={displaySession} />
			)}
		</Container>
	);
}

/* ───────────────────────────── Actions ───────────────────────────── */

function ShareButton() {
	const [copied, setCopied] = useState(false);
	return (
		<Button
			variant="primary"
			onClick={() => {
				if (typeof navigator !== "undefined" && navigator.clipboard) {
					navigator.clipboard.writeText(window.location.href).then(() => {
						setCopied(true);
						window.setTimeout(() => setCopied(false), 1800);
					});
				}
			}}
		>
			<Share2 className="size-4" aria-hidden="true" />
			{copied ? "Link copied" : "Share night"}
		</Button>
	);
}

/* ────────────────────────────── Picking ──────────────────────────── */

function PickingView({
	session,
	isHost,
	onPicked,
}: {
	session: NightSession;
	isHost: boolean;
	onPicked(session: NightSession): void;
}) {
	const [pickGame, { loading: picking }] = usePickGameMutation();
	const [pickError, setPickError] = useState<string | null>(null);
	const suggestions = session.suggestions ?? [];

	const items: RankedItem[] = useMemo(
		() =>
			suggestions.slice(0, 8).map((s) => ({
				key: s.thing.id,
				game: toGame(s.thing as Parameters<typeof toGame>[0]),
				suggestion: toSuggestion(s as Parameters<typeof toSuggestion>[0], session.attendeeCount),
			})),
		[suggestions, session.attendeeCount],
	);

	const handlePick = async (nodeId: string) => {
		setPickError(null);
		try {
			const result = await pickGame({ variables: { sessionId: session.id, gameId: nodeId } });
			const updated = result.data?.pickGame?.session;
			if (updated) onPicked({ ...session, ...updated } as NightSession);
		} catch (err) {
			setPickError(err instanceof Error ? err.message : "Could not pick game.");
		}
	};

	const fitSummary =
		session.attendeeCount === 0
			? undefined
			: `${suggestions.length} ${suggestions.length === 1 ? "game fits" : "games fit"} · ${session.attendeeCount} players · ≤${session.timeBudgetMinutes} min · ${String(session.complexityPreference).toLowerCase()}`;

	const attendees = toAttendees(session.attendances);

	return (
		<div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
			{session.attendeeCount === 0 ? (
				<Card className="p-6 text-sm text-muted lg:col-span-2">No confirmed players yet.</Card>
			) : (
				<RankedList
					items={items}
					fitSummary={fitSummary}
					isHost={isHost}
					picking={picking}
					pickError={pickError}
					onPick={(item) => handlePick(item.key)}
					onWhy={() => undefined}
				/>
			)}

			<div className="lg:sticky lg:top-20">
				<TableSidebar
					players={session.attendeeCount}
					timeBudget={`${session.timeBudgetMinutes}m`}
					complexity={String(session.complexityPreference)}
					attendees={attendees}
				/>
			</div>
		</div>
	);
}

/* ─────────────────────────── Invited / RSVP ──────────────────────── */

function AttendeeSummary({ attendances }: { attendances: Attendance[] }) {
	const going = attendances.filter((a) => a.response === "going");
	if (attendances.length === 0) {
		return <p className="text-sm text-muted">No confirmed players yet.</p>;
	}
	return (
		<ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
			{attendances.map((a) => (
				<li key={a.user.id}>
					<MemberRow
						name={a.user.displayName || a.user.username || "Member"}
						seed={a.user.id}
						sub={a.response === "going" ? "Going" : a.response === "maybe" ? "Maybe" : "—"}
					/>
				</li>
			))}
			<li className="sr-only">{going.length} going</li>
		</ul>
	);
}

function SessionRsvpCard({
	session,
	isHost,
	onStarted,
}: {
	session: NightSession;
	isHost: boolean;
	onStarted(session: NightSession): void;
}) {
	const [startPicking, { loading: starting }] = useStartPickingMutation();
	const [error, setError] = useState<string | null>(null);
	const going = session.attendances.filter((a) => a.response === "going").length;
	const total = session.attendances.length;

	const handleStart = async () => {
		setError(null);
		try {
			const result = await startPicking({ variables: { sessionId: session.id } });
			const updated = result.data?.startPicking?.session;
			if (updated) onStarted({ ...session, ...updated } as NightSession);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not start picking.");
		}
	};

	return (
		<Card className="flex flex-col gap-4 p-5">
			<div className="flex items-center justify-between">
				<Eyebrow>
					RSVPs · {going}/{total}
				</Eyebrow>
				<span className="numeric text-sm text-ink-2">
					<span className="font-bold text-ink">{going}</span> going
				</span>
			</div>
			<Meter value={total > 0 ? (going / total) * 100 : 0} label="RSVP progress" />
			<AttendeeSummary attendances={session.attendances} />
			{isHost && (
				<div className="flex flex-col gap-2">
					<Button onClick={handleStart} disabled={starting} className="self-start">
						{starting ? "Starting…" : "Start picking"}
					</Button>
					{error && (
						<p className="text-sm text-bad" role="alert">
							{error}
						</p>
					)}
				</div>
			)}
		</Card>
	);
}

/* ─────────────────────────────── Draft ───────────────────────────── */

function DraftScheduleForm({
	session,
	isHost,
	onScheduled,
}: {
	session: NightSession;
	isHost: boolean;
	onScheduled(session: NightSession): void;
}) {
	const [scheduleSession, { loading: scheduling }] = useScheduleSessionMutation();
	const [error, setError] = useState<string | null>(null);
	const [location, setLocation] = useState(session.location || "");
	const [capacity, setCapacity] = useState(session.capacity?.toString() || "");

	if (!isHost) return null;

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		try {
			const result = await scheduleSession({
				variables: {
					sessionId: session.id,
					location: location || undefined,
					capacity: capacity ? parseInt(capacity, 10) : undefined,
				},
			});
			const updated = result.data?.scheduleSession?.session;
			if (updated) onScheduled({ ...session, ...updated } as NightSession);
		} catch (err) {
			setError(
				err instanceof Error
					? `Could not schedule: ${err.message}`
					: "Could not schedule the session.",
			);
		}
	};

	return (
		<Card className="p-5">
			<h2 className="text-h2 mb-4 text-ink">Schedule this night</h2>
			<form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<Field
					label="Location"
					value={location}
					onChange={(e) => setLocation(e.target.value)}
					placeholder="Where are you playing?"
				/>
				<Field
					label="Capacity"
					type="number"
					min={1}
					value={capacity}
					onChange={(e) => setCapacity(e.target.value)}
					placeholder="How many players?"
				/>
				<div className="sm:col-span-2">
					<Button type="submit" disabled={scheduling}>
						{scheduling ? "Scheduling…" : "Schedule & send invites"}
					</Button>
				</div>
				{error && (
					<p className="text-sm text-bad sm:col-span-2" role="alert">
						{error}
					</p>
				)}
			</form>
		</Card>
	);
}

/* ────────────────────────── Edit details modal ───────────────────── */

function SessionDetailsEditor({
	session,
	isHost,
	onUpdated,
}: {
	session: NightSession;
	isHost: boolean;
	onUpdated(session: NightSession): void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [updateSession, { loading: updating }] = useUpdateSessionDetailsMutation();
	const [error, setError] = useState<string | null>(null);
	const [title, setTitle] = useState(session.title);
	const [description, setDescription] = useState(session.description || "");
	const [scheduledAt, setScheduledAt] = useState(() => {
		if (!session.scheduledAt) return "";
		const date = new Date(session.scheduledAt as string);
		return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
	});
	const [location, setLocation] = useState(session.location || "");
	const [capacity, setCapacity] = useState(session.capacity?.toString() || "");

	if (!isHost) return null;

	const handleOpen = () => {
		setIsOpen(true);
		setError(null);
		setTitle(session.title);
		setDescription(session.description || "");
		setScheduledAt(
			session.scheduledAt ? new Date(session.scheduledAt as string).toISOString().slice(0, 16) : "",
		);
		setLocation(session.location || "");
		setCapacity(session.capacity?.toString() || "");
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		try {
			const result = await updateSession({
				variables: {
					sessionId: session.id,
					title: title || undefined,
					description: description || undefined,
					scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
					location: location || undefined,
					capacity: capacity ? parseInt(capacity, 10) : undefined,
				},
			});
			const updated = result.data?.updateSessionDetails?.session;
			if (updated) {
				onUpdated({ ...session, ...updated } as NightSession);
				setIsOpen(false);
			}
		} catch (err) {
			setError(err instanceof Error ? `Could not save: ${err.message}` : "Could not save details.");
		}
	};

	return (
		<>
			<Button type="button" variant="outline" onClick={handleOpen}>
				<Pencil className="size-4" aria-hidden="true" />
				Edit constraints
			</Button>
			{isOpen && (
				<div
					role="presentation"
					className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-20 backdrop-blur-sm"
					onClick={(e) => {
						if (e.target === e.currentTarget) setIsOpen(false);
					}}
				>
					<Card
						role="dialog"
						aria-modal="true"
						aria-labelledby="edit-session-title"
						className="w-full max-w-lg p-6 shadow-shell"
					>
						<div className="mb-4 flex items-center justify-between">
							<h2 id="edit-session-title" className="text-h2 text-ink">
								Edit session details
							</h2>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => setIsOpen(false)}
								aria-label="Close"
							>
								<X className="size-4" aria-hidden="true" />
							</Button>
						</div>
						<form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
							<Field label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
							<div className="flex flex-col gap-1.5">
								<label htmlFor="edit-description" className="text-sm font-medium text-ink">
									Description
								</label>
								<textarea
									id="edit-description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={3}
									className="w-full rounded-md border border-line bg-surface p-3 text-base text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
								/>
							</div>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<Field
									label="Date/time"
									type="datetime-local"
									value={scheduledAt}
									onChange={(e) => setScheduledAt(e.target.value)}
								/>
								<Field
									label="Location"
									value={location}
									onChange={(e) => setLocation(e.target.value)}
								/>
							</div>
							<Field
								label="Capacity"
								type="number"
								min={1}
								value={capacity}
								onChange={(e) => setCapacity(e.target.value)}
							/>
							<p className="text-sm text-muted">Game preferences stay locked while picking.</p>
							{error && (
								<p className="text-sm text-bad" role="alert">
									{error}
								</p>
							)}
							<div className="flex justify-end gap-3 pt-2">
								<Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
									Cancel
								</Button>
								<Button type="submit" disabled={updating}>
									{updating ? "Saving…" : "Save details"}
								</Button>
							</div>
						</form>
					</Card>
				</div>
			)}
		</>
	);
}

/* ──────────────────────────── Completed ──────────────────────────── */

function CompletedView({ session }: { session: NightSession }) {
	const game = session.pickedGame
		? toGame(session.pickedGame as Parameters<typeof toGame>[0])
		: null;
	const cancelled = (session.state as SessionState) === "CANCELLED";

	return (
		<div className="grid items-start gap-6 lg:grid-cols-[1fr_300px]">
			<Card className="flex flex-col gap-4 p-5">
				<Eyebrow>{cancelled ? "This night was cancelled" : "Played on the night"}</Eyebrow>
				{game && !cancelled ? (
					<div className="max-w-xs">
						<GameCard game={game} selected />
					</div>
				) : (
					<p className="text-sm text-muted">
						{cancelled ? "No game was played." : "No game was picked for this session."}
					</p>
				)}
			</Card>
			<TableSidebar
				players={session.attendeeCount}
				timeBudget={`${session.timeBudgetMinutes}m`}
				complexity={String(session.complexityPreference)}
				attendees={toAttendees(session.attendances)}
			/>
		</div>
	);
}
