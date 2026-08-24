import { Link } from "react-router-dom";

/**
 * MarketingFooter — the public multi-column footer. Lives on landing and auth
 * pages only; the authenticated app ends in the quiet <AppFooter> one-liner.
 */
const columns = [
	{
		title: "Product",
		links: [
			{ label: "How it works", to: "/#tour" },
			{ label: "Collection browser", to: "/collection" },
			{ label: "Trending on BGG", to: "/hot" },
		],
	},
	{
		title: "Resources",
		links: [
			{ label: "BGG integration", to: "/account" },
			{ label: "Help", to: "/#" },
			{ label: "GitHub", to: "/#" },
		],
	},
];

export function MarketingFooter() {
	return (
		<footer className="border-t border-line bg-surface-2">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 md:flex-row md:justify-between">
				<div className="flex max-w-xs flex-col gap-3">
					<span className="font-display text-lg font-bold text-ink">BoardGameNight</span>
					<p className="text-sm leading-relaxed text-muted">
						One shelf for the whole crew. Plan the night, pick the game, play it — from games you
						already own.
					</p>
				</div>
				<div className="flex gap-16">
					{columns.map((col) => (
						<div key={col.title} className="flex flex-col gap-3">
							<h2 className="numeric text-[10px] font-medium tracking-[0.14em] text-faint uppercase">
								{col.title}
							</h2>
							<ul className="flex flex-col gap-2">
								{col.links.map((l) => (
									<li key={l.label}>
										<Link
											to={l.to}
											className="text-sm text-ink-2 transition-colors hover:text-primary"
										>
											{l.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			</div>
			<div className="border-t border-line">
				<div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
					<p>Made for game nights. Not affiliated with BoardGameGeek.</p>
					<p className="numeric">© {new Date().getFullYear()} BoardGameNight</p>
				</div>
			</div>
		</footer>
	);
}
