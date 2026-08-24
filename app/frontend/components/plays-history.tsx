import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
	Download,
	Star,
	Users,
	Clock,
	MapPin,
	Loader2,
	Check,
	AlertCircle,
	RotateCw,
} from "lucide-react";
import { Button, Badge, Card, Eyebrow } from "@/components/atoms";
import { EmptyState, FannedCovers } from "@/components/molecules";
import type { ButtonProps } from "@/components/atoms";
import { GROUP_PLAYS, IMPORT_PLAYS } from "@/lib/graphql/documents";
import type { GqlPlay, GqlPlayPlayer, ImportPlaysPayload } from "@/lib/graphql/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function toDateKey(iso: string): string {
	// Extract YYYY-MM-DD from the date string (handles both ISO datetime and date-only)
	return iso.slice(0, 10);
}

function isToday(iso: string): boolean {
	return toDateKey(iso) === toDateKey(new Date().toISOString());
}

function isYesterday(iso: string): boolean {
	const d = new Date();
	d.setDate(d.getDate() - 1);
	return toDateKey(iso) === toDateKey(d.toISOString());
}

function isThisWeek(iso: string): boolean {
	const playDate = new Date(iso);
	const now = new Date();
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(now.getDate() - 7);
	return playDate >= sevenDaysAgo && !isToday(iso) && !isYesterday(iso);
}

type DateGroup = "today" | "yesterday" | "this-week" | "earlier";

const DATE_GROUP_LABELS: Record<DateGroup, string> = {
	today: "Today",
	yesterday: "Yesterday",
	"this-week": "This week",
	earlier: "Earlier",
};

const DATE_GROUP_ORDER: DateGroup[] = ["today", "yesterday", "this-week", "earlier"];

function classifyDate(iso: string): DateGroup {
	if (isToday(iso)) return "today";
	if (isYesterday(iso)) return "yesterday";
	if (isThisWeek(iso)) return "this-week";
	return "earlier";
}

function formatDate(iso: string): string {
	const d = new Date(iso);
	return d.toLocaleDateString("en-US", {
		weekday: "short",
		month: "short",
		day: "numeric",
	});
}

function formatDuration(minutes: number): string {
	if (minutes < 60) return `${minutes}m`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ---------------------------------------------------------------------------
// Player chip
// ---------------------------------------------------------------------------

function PlayerChip({ player }: { player: GqlPlayPlayer }) {
	const displayName = player.name || player.username;
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[11px] font-medium",
				player.win ? "bg-good-bg text-good" : "bg-inset text-ink-2",
			)}
		>
			{player.win && <Star className="size-3 shrink-0 fill-current" />}
			<span className="max-w-[100px] truncate">{displayName}</span>
			{player.score !== null && (
				<span className="numeric ml-0.5 text-[10px] text-muted">{player.score}</span>
			)}
		</span>
	);
}

// ---------------------------------------------------------------------------
// Single play row
// ---------------------------------------------------------------------------

function PlayRow({ play }: { play: GqlPlay }) {
	return (
		<div
			className={cn(
				"flex flex-col gap-2.5 rounded-md bg-inset/60 px-4 py-3",
				"transition-colors duration-150 hover:bg-inset",
			)}
		>
			{/* Top line: game name + meta badges */}
			<div className="flex flex-wrap items-center gap-2">
				<h4 className="min-w-0 truncate text-sm font-semibold text-ink">{play.gameName}</h4>
				<div className="flex shrink-0 items-center gap-1.5">
					<Badge className="gap-1">
						<Users className="size-3 text-primary" />
						{play.players.length}
					</Badge>
					{play.lengthMinutes != null && play.lengthMinutes > 0 && (
						<Badge className="gap-1">
							<Clock className="size-3 text-muted" />
							{formatDuration(play.lengthMinutes)}
						</Badge>
					)}
					{play.location && (
						<Badge className="gap-1">
							<MapPin className="size-3 text-muted" />
							<span className="max-w-[100px] truncate">{play.location}</span>
						</Badge>
					)}
					{play.incomplete && <Badge tone="warn">Incomplete</Badge>}
				</div>
			</div>

			{/* Second line: logged by + date */}
			<p className="text-xs text-muted">
				Logged by <span className="font-medium text-ink-2">{play.user.displayName}</span> ·{" "}
				{formatDate(play.date)}
				{play.quantity > 1 && <span className="ml-1 text-muted">({play.quantity} plays)</span>}
			</p>

			{/* Player results */}
			{play.players.length > 0 && (
				<div className="flex flex-wrap gap-1">
					{play.players.map((p) => (
						<PlayerChip key={`${p.id}-${p.username}`} player={p} />
					))}
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function PlayRowSkeleton() {
	return (
		<div className="flex flex-col gap-2.5 rounded-md bg-inset/60 px-4 py-3">
			<div className="flex items-center gap-2">
				<div className="skeleton h-4 w-36 rounded-pill" />
				<div className="skeleton h-5 w-10 rounded-pill" />
				<div className="skeleton h-5 w-12 rounded-pill" />
			</div>
			<div className="skeleton h-3 w-48 rounded-pill" />
			<div className="flex gap-1">
				<div className="skeleton h-5 w-16 rounded-pill" />
				<div className="skeleton h-5 w-20 rounded-pill" />
				<div className="skeleton h-5 w-14 rounded-pill" />
			</div>
		</div>
	);
}

function PlaysHistorySkeleton() {
	return (
		<Card className="flex flex-col gap-4 p-5">
			<div className="skeleton h-3 w-24 rounded-pill" />
			<div className="flex flex-col gap-3">
				{Array.from({ length: 4 }).map((_, i) => (
					<PlayRowSkeleton key={i} />
				))}
			</div>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// Grouped plays list
// ---------------------------------------------------------------------------

function GroupedPlaysList({ plays }: { plays: GqlPlay[] }) {
	const grouped = useMemo(() => {
		const map = new Map<DateGroup, GqlPlay[]>();
		for (const play of plays) {
			const group = classifyDate(play.date);
			if (!map.has(group)) map.set(group, []);
			map.get(group)!.push(play);
		}
		return DATE_GROUP_ORDER.filter((g) => map.has(g) && map.get(g)!.length > 0).map((g) => ({
			group: g,
			plays: map.get(g)!,
		}));
	}, [plays]);

	return (
		<div className="flex flex-col gap-5">
			{grouped.map(({ group, plays: groupPlays }) => (
				<section key={group}>
					<p className="mb-2 numeric text-[11px] font-semibold tracking-[0.12em] text-muted uppercase">
						{DATE_GROUP_LABELS[group]}
					</p>
					<div className="flex flex-col gap-2">
						{groupPlays.map((play) => (
							<PlayRow key={play.id} play={play} />
						))}
					</div>
				</section>
			))}
		</div>
	);
}

// ---------------------------------------------------------------------------
// PlaysHistory — main exported component
// ---------------------------------------------------------------------------

interface PlaysHistoryProps {
	groupId: string | undefined;
	/** Actions rendered inside the first-run empty state (import / log a play). */
	emptyActions?: React.ReactNode;
	/** Action rendered beside the "Recent Plays" header when plays exist. */
	headerAction?: React.ReactNode;
}

export function PlaysHistory({ groupId, emptyActions, headerAction }: PlaysHistoryProps) {
	const { data, loading, error, refetch } = useQuery(GROUP_PLAYS, {
		variables: { groupId: groupId!, limit: 20 },
		skip: !groupId,
	});

	const plays: GqlPlay[] = data?.groupPlays ?? [];

	// --- Loading ---
	if (loading && !data) {
		return <PlaysHistorySkeleton />;
	}

	// --- Error ---
	if (error) {
		return (
			<Card className="flex flex-col items-center gap-4 p-8 text-center">
				<span className="flex size-10 items-center justify-center rounded-pill bg-bad-bg">
					<AlertCircle className="size-5 text-bad" />
				</span>
				<div className="flex flex-col gap-1">
					<p className="text-sm font-semibold text-ink">Failed to load play history</p>
					<p className="text-xs text-muted">{error.message}</p>
				</div>
				<Button variant="outline" size="sm" onClick={() => refetch()}>
					<RotateCw className="size-3.5" />
					Retry
				</Button>
			</Card>
		);
	}

	// --- Empty ---
	if (plays.length === 0) {
		return (
			<EmptyState
				visual={<FannedCovers />}
				title="Nothing logged yet"
				description="Import your plays from BoardGameGeek and this becomes a running record of what the crew actually plays — which feeds back into how nights get ranked."
				actions={emptyActions}
			/>
		);
	}

	// --- Content ---
	return (
		<Card className="flex flex-col gap-4 p-5">
			<div className="flex items-center justify-between gap-3">
				<Eyebrow>Recent Plays</Eyebrow>
				<div className="flex items-center gap-3">
					<span className="text-xs text-muted">
						{plays.length} {plays.length === 1 ? "play" : "plays"}
					</span>
					{headerAction}
				</div>
			</div>
			<GroupedPlaysList plays={plays} />
		</Card>
	);
}

// ---------------------------------------------------------------------------
// ImportPlaysButton — import BGG play history
// ---------------------------------------------------------------------------

interface ImportPlaysButtonProps {
	username: string;
	groupId: string | undefined;
	onComplete?: () => void;
	variant?: ButtonProps["variant"];
	size?: ButtonProps["size"];
	label?: string;
	className?: string;
}

type ImportStatus = "idle" | "loading" | "success" | "error";

export function ImportPlaysButton({
	username,
	onComplete,
	variant = "outline",
	size = "sm",
	label = "Import plays",
	className,
}: ImportPlaysButtonProps) {
	const [status, setStatus] = useState<ImportStatus>("idle");
	const [message, setMessage] = useState<string | null>(null);

	const [importPlays] = useMutation<{ importPlays: ImportPlaysPayload }>(IMPORT_PLAYS);

	const handleClick = useCallback(async () => {
		if (status === "loading") return;

		setStatus("loading");
		setMessage(null);

		try {
			const { data } = await importPlays({ variables: { username } });
			const payload = data?.importPlays;

			if (payload?.success) {
				setStatus("success");
				setMessage(payload.message || "Play history imported successfully");
				onComplete?.();
				// Reset success state after a few seconds
				setTimeout(() => {
					setStatus("idle");
					setMessage(null);
				}, 4000);
			} else {
				setStatus("error");
				setMessage(payload?.message || "Import failed — please try again");
			}
		} catch (err) {
			setStatus("error");
			setMessage(err instanceof Error ? err.message : "Something went wrong");
		}
	}, [importPlays, username, status, onComplete]);

	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<Button variant={variant} size={size} onClick={handleClick} disabled={status === "loading"}>
				{status === "loading" ? (
					<Loader2 className="size-3.5 animate-spin" />
				) : (
					<Download className="size-3.5" />
				)}
				{label}
			</Button>

			{/* Inline feedback message */}
			{message && (
				<p
					className={cn(
						"flex items-center gap-1.5 text-xs",
						status === "success" && "text-good",
						status === "error" && "text-bad",
					)}
					role="status"
					aria-live="polite"
				>
					{status === "success" && <Check className="size-3 shrink-0" />}
					{status === "error" && <AlertCircle className="size-3 shrink-0" />}
					{message}
				</p>
			)}
		</div>
	);
}
