import { Avatar, Eyebrow, Meter } from "@/components/atoms";
import { StepCard } from "@/components/molecules";

/**
 * HowItWorks — the "≈ 3 minutes, once" tour. Four StepCards (01–03 on paper,
 * 04 the inverted payoff) each carrying a small token-built diagram in the
 * StepCard visual slot. Anchored at #tour for the public nav.
 */

function GatherVisual() {
	return (
		<div className="flex items-center gap-1.5">
			<Avatar name="Sam M" seed="sm" size="md" />
			<Avatar name="Dan G" seed="dg" size="md" />
			<span className="numeric flex size-8 items-center justify-center rounded-pill border border-dashed border-line text-sm text-faint">
				+
			</span>
		</div>
	);
}

function MergeVisual() {
	return (
		<div className="flex items-end gap-1">
			<span className="h-[34px] w-6 rounded-[4px] bg-line-soft" />
			<span className="h-[34px] w-6 rounded-[4px] bg-line-soft" />
			<span className="h-11 w-6 rounded-[4px] bg-primary" />
			<span className="h-[34px] w-6 rounded-[4px] bg-line-soft" />
			<span className="h-[34px] w-6 rounded-[4px] bg-line-soft" />
		</div>
	);
}

function TableVisual() {
	const rows = [
		{ label: "players", value: "4" },
		{ label: "time", value: "90m" },
		{ label: "weight", value: "light" },
	];
	return (
		<div className="flex w-full flex-col gap-1.5 px-3">
			{rows.map((r) => (
				<div key={r.label} className="numeric flex justify-between text-[11px] text-ink-2">
					<span>{r.label}</span>
					<span className="font-bold">{r.value}</span>
				</div>
			))}
		</div>
	);
}

function PayoffVisual() {
	return (
		<div className="flex w-full items-center gap-2.5 px-3">
			<span className="numeric text-[28px] font-bold text-on-contrast-good">94</span>
			<div className="flex flex-1 flex-col gap-1">
				<Meter value={94} size="sm" tone="primary" label="Top pick match" />
				<Meter value={89} size="sm" tone="primary" label="Runner-up match" />
				<Meter value={71} size="sm" tone="warn" label="Third pick match" />
			</div>
		</div>
	);
}

export function HowItWorks() {
	return (
		<section id="tour" className="border-b border-line bg-inset py-12 sm:py-16">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6">
				<div className="flex flex-wrap items-end gap-4">
					<div className="flex flex-col gap-2">
						<Eyebrow>The tour</Eyebrow>
						<h2 className="text-h1 max-w-xl text-balance text-ink">
							From &ldquo;what should we play?&rdquo; to dice on the table.
						</h2>
					</div>
					<span className="numeric ml-auto text-xs text-faint">≈ 3 minutes, once</span>
				</div>

				<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
					<StepCard step="01" timing="30 sec" title="Gather the crew" visual={<GatherVisual />}>
						Make a group, share one link. Everyone drops in their BGG username.
					</StepCard>
					<StepCard step="02" timing="automatic" title="Merge the shelves" visual={<MergeVisual />}>
						Collections combine and duplicates collapse, with owners kept on every game.
					</StepCard>
					<StepCard step="03" timing="night-of" title="Set the table" visual={<TableVisual />}>
						Who&rsquo;s coming, how long you&rsquo;ve got, how heavy you&rsquo;re feeling.
					</StepCard>
					<StepCard
						step="04"
						timing="the payoff"
						title="Get a ranked pick"
						payoff
						visual={<PayoffVisual />}
					>
						Scores, confidence and reasons you can argue with. Host picks, night starts.
					</StepCard>
				</div>
			</div>
		</section>
	);
}
