import { LinkButton } from "@/components/atoms";
import { LandingHero } from "@/components/organisms/landing-hero";
import { HowItWorks } from "@/components/organisms/how-it-works";
import { TrendingStrip } from "@/components/organisms/trending-strip";
import { useHotItemsQuery } from "@/generated/operations";

/**
 * LandingPage ("/") — the Felt & Ink marketing opener. Renders inside
 * PublicShell (top nav + marketing footer). Composes the hero try box, the
 * four-step tour (#tour), the live BGG trending strip (#trending) and the
 * final CTA band.
 */
export function LandingPage() {
	const hotQuery = useHotItemsQuery();
	const trending = hotQuery.data?.hotItems.slice(0, 6) ?? [];

	return (
		<>
			<LandingHero />

			<HowItWorks />

			<TrendingStrip items={trending} loading={hotQuery.loading} error={Boolean(hotQuery.error)} />

			{/* CTA band -------------------------------------------------------- */}
			<section className="bg-contrast text-on-contrast">
				<div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-6 px-4 py-11 sm:px-6">
					<div className="flex flex-col gap-2">
						<h2 className="font-display text-h1 text-balance text-on-contrast">
							Ready for Friday?
						</h2>
						<p className="text-base text-on-contrast-muted">
							No credit card. No commitment. Just games you already own.
						</p>
					</div>
					<LinkButton to="/signup" variant="accent" size="lg" className="ml-auto shadow-lift">
						Create your group — free
					</LinkButton>
				</div>
			</section>
		</>
	);
}
