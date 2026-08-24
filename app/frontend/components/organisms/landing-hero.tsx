import { Avatar, Eyebrow } from "@/components/atoms";
import { CollectionMergeForm } from "@/components/landing/collection-merge-form";

/**
 * LandingHero — the "/" opener. On the left: the felt-green eyebrow, the
 * display headline, the promise, and the "Merge shelves" try box. On the right:
 * a mocked "instrument" device (dark contrast panel) showing a ranked Friday
 * night so the value is visible before signup. The device data is decorative.
 */

const crew = [
	{ id: "ar", name: "Ana R" },
	{ id: "sd", name: "Sam D" },
	{ id: "jl", name: "Jo L" },
	{ id: "rc", name: "Ray C" },
];

const runnerUps = [
	{ title: "Clank!", score: 89, warn: false },
	{ title: "Century", score: 86, warn: false },
	{ title: "Istanbul", score: 71, warn: true },
];

export function LandingHero() {
	return (
		<section className="border-b border-line py-14 sm:py-20">
			<div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_470px]">
				{/* Pitch --------------------------------------------------------- */}
				<div className="flex flex-col gap-5">
					<Eyebrow tone="primary">One shelf for the whole crew</Eyebrow>
					<h1 className="text-display max-w-xl text-balance text-ink">
						Four people. Ninety minutes. One right game.
					</h1>
					<p className="max-w-lg text-lg leading-relaxed text-pretty text-ink-2">
						Merge everyone&rsquo;s BoardGameGeek collections into one shelf, tell us who&rsquo;s
						coming and how long you&rsquo;ve got, and we&rsquo;ll rank the games you already own —
						with the reasons in plain language.
					</p>
					<CollectionMergeForm />
				</div>

				{/* Instrument device (mocked) ----------------------------------- */}
				<div className="flex flex-col gap-3.5 rounded-card border border-contrast-line bg-contrast p-4 text-on-contrast shadow-lift">
					<div className="flex items-center gap-2">
						<span className="numeric text-[10px] tracking-[0.14em] text-on-contrast-faint uppercase">
							Strategy Crew
						</span>
						<span className="numeric ml-auto rounded-pill border border-good/30 bg-good/10 px-2 py-1 text-[10px] text-on-contrast-good">
							FRIDAY 7:00 PM
						</span>
					</div>

					<div className="flex items-center gap-2.5">
						<div className="flex">
							{crew.map((m) => (
								<Avatar
									key={m.id}
									name={m.name}
									seed={m.id}
									size="sm"
									className="-ml-1.5 ring-2 ring-contrast first:ml-0"
								/>
							))}
						</div>
						<span className="text-[13px] text-on-contrast-muted">
							4 going · 88 games merged, 14 duplicates removed
						</span>
					</div>

					{/* Top pick */}
					<div className="flex items-center gap-3.5 rounded-md border border-contrast-line bg-contrast-2 p-3.5">
						<div className="cover-weave h-[82px] w-16 shrink-0 rounded-md border border-contrast-line" />
						<div className="flex flex-1 flex-col gap-1.5">
							<span className="font-display text-xl font-bold text-on-contrast">Wingspan</span>
							<div className="flex flex-wrap gap-1.5">
								<span className="numeric rounded-chip border border-good/25 bg-good/10 px-1.5 py-0.5 text-[11px] text-on-contrast-good">
									✓ 4 players
								</span>
								<span className="numeric rounded-chip border border-good/25 bg-good/10 px-1.5 py-0.5 text-[11px] text-on-contrast-good">
									✓ 70m
								</span>
								<span className="numeric rounded-chip border border-warn/25 bg-warn/10 px-1.5 py-0.5 text-[11px] text-accent">
									★ best at 4
								</span>
							</div>
						</div>
						<div className="flex flex-col items-end">
							<span className="numeric text-[26px] leading-none font-bold text-on-contrast-good">
								94
							</span>
							<span className="numeric text-[9px] tracking-[0.12em] text-on-contrast-faint uppercase">
								Score
							</span>
						</div>
					</div>

					{/* Runner-ups */}
					<div className="flex gap-2">
						{runnerUps.map((g) => (
							<div
								key={g.title}
								className="flex flex-1 items-center justify-between rounded-md border border-contrast-line bg-contrast-2 px-2.5 py-2"
							>
								<span className="text-xs text-on-contrast-muted">{g.title}</span>
								<span
									className={`numeric text-[13px] font-bold ${
										g.warn ? "text-accent" : "text-on-contrast-good"
									}`}
								>
									{g.score}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
