import { Card } from "@/components/atoms/card";
import { Eyebrow } from "@/components/atoms/eyebrow";
import { cn } from "@/lib/utils";

/**
 * ScoreBreakdown — the "how scoring works" explainer. Reinforces the mental
 * model behind every match number: rating first, bonuses for fit and votes,
 * penalty for weight over the cap.
 */
const factors: { label: string; delta: string; positive: boolean }[] = [
	{ label: "fit players", delta: "+30", positive: true },
	{ label: "fit time", delta: "+25", positive: true },
	{ label: "best-at votes", delta: "+20", positive: true },
	{ label: "over complexity", delta: "−15", positive: false },
];

export function ScoreBreakdown({ className }: { className?: string }) {
	return (
		<Card className={cn("flex flex-col gap-2.5 p-4", className)}>
			<Eyebrow>How scoring works</Eyebrow>
			<p className="text-[13px] leading-relaxed text-ink-2">
				A game starts at its BGG rating, then gains for fitting your player count and time budget
				and for community “best at N” votes, and loses for weight over your complexity cap.
			</p>
			<dl className="numeric flex flex-col gap-1.5 text-[11px] text-ink-2">
				{factors.map((f) => (
					<div key={f.label} className="flex justify-between">
						<dt>{f.label}</dt>
						<dd className={f.positive ? "text-primary" : "text-bad"}>{f.delta}</dd>
					</div>
				))}
			</dl>
		</Card>
	);
}
