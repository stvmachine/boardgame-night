import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, MapPin, Users, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, Button, LinkButton, StatusPill, Skeleton } from "@/components/atoms";
import { useAuth } from "@/contexts/AuthContext";
import { useGetSessionInviteQuery, useRsvpMutation } from "@/generated/operations";
import type { GetSessionInviteQuery } from "@/generated/operations";

type Invite = NonNullable<GetSessionInviteQuery["sessionInvite"]>;

const SAFE_NON_MUTATING_STATUSES = ["ACCEPTED", "EXPIRED", "REVOKED", "USED"];

function formatInviteDate(value: unknown) {
	if (!value) return null;
	const date = new Date(String(value));
	if (Number.isNaN(date.getTime())) return null;
	return {
		weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
		date: date.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
		time: date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
	};
}

function responseLabel(response: string) {
	if (response === "going") return "Going";
	if (response === "not_going") return "Not Going";
	return response;
}

export function InvitePage() {
	const { token } = useParams<{ token: string }>();
	const { user } = useAuth();
	const [rsvpResult, setRsvpResult] = useState<{ response: string; displayName: string } | null>(
		null,
	);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const { data, loading, error } = useGetSessionInviteQuery({
		variables: { token: token ?? "" },
		skip: !token,
	});
	const invite = data?.sessionInvite ?? null;
	const session = invite?.session ?? null;
	const sessionState =
		(session?.state as import("@/lib/data").SessionState | undefined) ?? "INVITED";

	const [rsvp, { loading: rsvpLoading }] = useRsvpMutation();

	const date = useMemo(() => formatInviteDate(session?.scheduledAt), [session?.scheduledAt]);

	const isNonMutating = invite ? SAFE_NON_MUTATING_STATUSES.includes(invite.status) : false;

	const handleResponse = async (response: "going" | "not_going") => {
		setSubmitError(null);
		try {
			const { data } = await rsvp({ variables: { token: token ?? "", response } });
			const attendance = data?.rsvp?.attendance;
			if (attendance) {
				setRsvpResult({ response: attendance.response, displayName: attendance.user.displayName });
			}
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Could not save your response. Please try again.";
			setSubmitError(message);
		}
	};

	if (loading) {
		return (
			<div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6" aria-busy="true">
				<div
					className="flex flex-col gap-4"
					role="progressbar"
					aria-label="Loading invite"
					aria-busy="true"
				>
					<Skeleton className="h-40 rounded-card" />
					<Skeleton className="h-24 rounded-card" />
					<Skeleton className="h-12 rounded-card" />
				</div>
			</div>
		);
	}

	if (error || !invite) {
		return (
			<div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
				<Card className="flex flex-col items-center gap-3 p-12 text-center">
					<h2 className="text-h3 text-ink">Invite not found</h2>
					<p className="text-muted">
						This invitation may have expired, been revoked, or the link is incorrect.
					</p>
					<LinkButton to="/" variant="outline" size="lg">
						Back home
					</LinkButton>
				</Card>
			</div>
		);
	}

	if (isNonMutating) {
		const title =
			invite.status === "ACCEPTED" || invite.status === "USED"
				? "This invite has already been used"
				: "This invite has expired";
		return (
			<div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
				<Card className="flex flex-col items-center gap-3 p-12 text-center">
					<h2 className="text-h3 text-ink">{title}</h2>
					<p className="text-muted">This invitation can no longer be used to RSVP.</p>
					<LinkButton to="/" variant="outline" size="lg">
						Back home
					</LinkButton>
				</Card>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
			<Link
				to="/"
				className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
			>
				<ChevronLeft className="size-4" aria-hidden="true" />
				Back home
			</Link>

			<Card className="flex flex-col gap-5 p-6 sm:p-8">
				{session ? (
					<>
						<div className="flex flex-col gap-2">
							<div className="flex items-center justify-between gap-3">
								<h1 className="text-h2 text-ink">{session.title}</h1>
								<StatusPill state={sessionState} />
							</div>
							<p className="text-muted">{invite.group.name}</p>
						</div>

						<div className="flex flex-col gap-2 text-sm text-ink-2">
							{date ? (
								<div className="flex items-center gap-2">
									<CalendarDays className="size-4 text-muted" aria-hidden="true" />
									<span>
										{date.weekday}, {date.date} <span className="text-faint">·</span> {date.time}
									</span>
								</div>
							) : null}
							{session.location ? (
								<div className="flex items-center gap-2">
									<MapPin className="size-4 text-muted" aria-hidden="true" />
									<span>{session.location}</span>
								</div>
							) : (
								<div className="flex items-center gap-2">
									<MapPin className="size-4 text-muted" aria-hidden="true" />
									<span>Location to be decided</span>
								</div>
							)}
							{session.host ? (
								<div className="flex items-center gap-2">
									<Users className="size-4 text-muted" aria-hidden="true" />
									<span>Hosted by {session.host.displayName}</span>
								</div>
							) : null}
						</div>
					</>
				) : (
					<div className="flex flex-col gap-2">
						<h1 className="text-h2 text-ink">Group invitation</h1>
						<p className="text-muted">{invite.group.name}</p>
					</div>
				)}

				{rsvpResult ? (
					<div className="flex items-start gap-3 rounded-card border border-good/25 bg-good-bg p-4 text-good">
						<CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
						<div className="flex flex-col gap-1">
							<p className="font-semibold">
								Thanks! Your response is {responseLabel(rsvpResult.response)}
							</p>
							<p className="text-sm opacity-90">Saved for {rsvpResult.displayName}.</p>
						</div>
					</div>
				) : user ? (
					<div className="flex flex-col gap-4">
						<p className="text-sm text-muted">
							Are you coming? Let the host know so they can plan the night.
						</p>
						{submitError ? (
							<div
								className="flex items-start gap-3 rounded-card border border-bad/25 bg-bad-bg p-4 text-bad"
								role="alert"
							>
								<AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
								<div className="flex flex-col gap-1">
									<p className="font-semibold">Something went wrong</p>
									<p className="text-sm opacity-90">{submitError}</p>
								</div>
							</div>
						) : null}
						<div className="flex flex-wrap gap-3">
							<Button
								onClick={() => handleResponse("going")}
								disabled={rsvpLoading}
								className="min-w-[8rem]"
							>
								Going
							</Button>
							<Button
								variant="outline"
								onClick={() => handleResponse("not_going")}
								disabled={rsvpLoading}
								className="min-w-[8rem]"
							>
								Not Going
							</Button>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						<p className="text-sm text-muted">
							Sign in to let the host know whether you’re coming.
						</p>
						<LinkButton
							to={`/login?return=${encodeURIComponent(`/invite/${token ?? ""}`)}`}
							size="lg"
						>
							Sign in to RSVP
						</LinkButton>
					</div>
				)}
			</Card>
		</div>
	);
}
