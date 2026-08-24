import { Search } from "lucide-react";
import {
	complexityLabels,
	inTimeBucket,
	timeLabels,
	type Complexity,
	type Filters,
	type PlayerRange,
	type TimeBucket,
} from "@/lib/collection";
import type { Game, Member } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Card } from "@/components/atoms/card";
import { Eyebrow } from "@/components/atoms/eyebrow";
import { Chip } from "@/components/atoms/chip";
import { Avatar } from "@/components/atoms/avatar";
import { SegmentedControl } from "@/components/atoms/segmented-control";
import { FilterGroup } from "@/components/molecules/filter-group";

const timeOptions: TimeBucket[] = [1, 2, 3, 4];
const complexityOptions: Array<{ value: string; label: string }> = [
	{ value: "0", label: "Any" },
	...([1, 2, 3] as Complexity[]).map((value) => ({
		value: String(value),
		label: complexityLabels[value],
	})),
];

function normalizedRange(range: PlayerRange | null) {
	return range ?? { min: 1, max: 10 };
}

function nextRange(min: number, max: number): PlayerRange | null {
	return min === 1 && max === 10 ? null : { min, max };
}

/**
 * FilterPanel — the collection's control panel. A single dark "instrument"
 * card: search, owners with live counts, a player-range slider, play-time
 * chips, and a complexity segmented control. Powerful, not a plain form.
 */
export function FilterPanel({
	filters,
	setFilters,
	games,
	members,
	activeCount = 0,
	onClear,
}: {
	filters: Filters;
	setFilters: (next: Partial<Filters>) => void;
	games: Game[];
	members: Member[];
	activeCount?: number;
	onClear?: () => void;
}) {
	const range = normalizedRange(filters.players);
	const allOwnerIds = members.map((m) => m.id);
	const selectedOwners = filters.owners.length === 0 ? allOwnerIds : filters.owners;

	function toggleOwner(ownerId: string) {
		const next = selectedOwners.includes(ownerId)
			? selectedOwners.filter((id) => id !== ownerId)
			: [...selectedOwners, ownerId];
		setFilters({ owners: next.length === allOwnerIds.length ? [] : next });
	}

	function toggleTime(bucket: TimeBucket) {
		const times = filters.times.includes(bucket)
			? filters.times.filter((v) => v !== bucket)
			: [...filters.times, bucket];
		setFilters({ times });
	}

	return (
		<Card tone="contrast" className="flex flex-col gap-4 p-4">
			<div className="flex items-center justify-between">
				<Eyebrow className="text-on-contrast-faint">Filters</Eyebrow>
				{activeCount > 0 && onClear && (
					<button
						type="button"
						onClick={onClear}
						className="numeric text-[11px] text-on-contrast-good hover:underline"
					>
						{activeCount} active · reset
					</button>
				)}
			</div>

			{/* Search */}
			<label className="flex h-9 items-center gap-2 rounded-md border border-contrast-line bg-contrast-2 px-2.5">
				<Search className="size-4 shrink-0 text-on-contrast-faint" aria-hidden="true" />
				<span className="sr-only">Search</span>
				<input
					type="search"
					value={filters.q}
					onChange={(e) => setFilters({ q: e.target.value })}
					placeholder={`Search ${games.length} games`}
					aria-label="Search games"
					className="min-w-0 flex-1 bg-transparent text-[13px] text-on-contrast placeholder:text-on-contrast-faint focus:outline-none"
				/>
			</label>

			{/* Owners */}
			<FilterGroup label="Owners">
				<ul className="flex flex-col gap-2">
					{members.map((member) => {
						const selected = selectedOwners.includes(member.id);
						const count = games.filter((g) => g.owners.includes(member.id)).length;
						return (
							<li key={member.id}>
								<button
									type="button"
									aria-pressed={selected}
									onClick={() => toggleOwner(member.id)}
									className={cn(
										"flex w-full items-center gap-2.5 rounded-md border px-2.5 py-1.5 text-left",
										selected
											? "border-primary/50 bg-contrast-2"
											: "border-transparent bg-contrast-2/40 opacity-60 hover:opacity-100",
									)}
								>
									<Avatar name={member.bgg} seed={member.id} size="sm" />
									<span className="min-w-0 flex-1 truncate text-[13px] text-on-contrast">
										{member.bgg}
									</span>
									<span className="numeric text-[11px] text-on-contrast-good">{count}</span>
								</button>
							</li>
						);
					})}
				</ul>
			</FilterGroup>

			{/* Players */}
			<FilterGroup label="Players" value={`${range.min}–${range.max === 10 ? "10+" : range.max}`}>
				<div className="flex flex-col gap-2">
					<input
						type="range"
						min={1}
						max={10}
						step={1}
						value={range.min}
						aria-label="Minimum players"
						onChange={(e) =>
							setFilters({
								players: nextRange(Math.min(Number(e.target.value), range.max), range.max),
							})
						}
						className="w-full accent-on-contrast-good"
					/>
					<input
						type="range"
						min={1}
						max={10}
						step={1}
						value={range.max}
						aria-label="Maximum players"
						onChange={(e) =>
							setFilters({
								players: nextRange(range.min, Math.max(Number(e.target.value), range.min)),
							})
						}
						className="w-full accent-on-contrast-good"
					/>
				</div>
			</FilterGroup>

			{/* Play time */}
			<FilterGroup label="Play time">
				<div className="flex flex-wrap gap-1.5">
					{timeOptions.map((bucket) => {
						const count = games.filter((g) => inTimeBucket(g.minutes, bucket)).length;
						return (
							<Chip
								key={bucket}
								tone="contrast"
								active={filters.times.includes(bucket)}
								count={count}
								onClick={() => toggleTime(bucket)}
							>
								{timeLabels[bucket]}
							</Chip>
						);
					})}
				</div>
			</FilterGroup>

			{/* Complexity */}
			<FilterGroup label="Complexity">
				<SegmentedControl
					tone="ink"
					size="sm"
					value={String(filters.complexity ?? 0)}
					options={complexityOptions}
					onChange={(v) => setFilters({ complexity: v === "0" ? null : (Number(v) as Complexity) })}
				/>
			</FilterGroup>
		</Card>
	);
}
