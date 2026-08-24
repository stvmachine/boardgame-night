import { LinkButton, StarRating } from "@/components/atoms";
import { EmptyState, GameCover } from "@/components/molecules";
import type { GetGroupQuery } from "@/generated/operations";

type Group = NonNullable<GetGroupQuery["group"]>;
type SpotlightGame = Group["collectionSpotlight"][number];

function ownersLabel(owners: SpotlightGame["owners"], memberCount: number) {
	const count = owners.length;
	if (count === 0) return "unowned";
	if (count === 1) return `${owners[0].bggUsername} owns`;
	if (count >= memberCount && memberCount > 0) return "everyone owns";
	return `${count} owners`;
}

/**
 * ShelfSpotlight — a 4-up grid of compact game cards drawn from the merged
 * group collection. Each card is a GameCover + name + a mono
 * "★ rating · owners" line, linking out to BoardGameGeek.
 */
export function ShelfSpotlight({ group }: { group: Group }) {
	const games = group.collectionSpotlight.slice(0, 4);
	const token = group.inviteCode ?? group.id;

	return (
		<section className="flex flex-col gap-3">
			<div className="flex items-baseline justify-between gap-4">
				<h2 className="font-display text-lg font-bold text-ink">Shelf spotlight</h2>
				<LinkButton to={`/collection?group=${encodeURIComponent(token)}`} variant="link" size="sm">
					Browse all {group.collectionTotalCount}
				</LinkButton>
			</div>

			{games.length > 0 ? (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
					{games.map((game) => (
						<a
							key={game.id}
							data-testid="spotlight-game"
							href={`https://boardgamegeek.com/boardgame/${encodeURIComponent(game.objectid)}`}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={`${game.name} on BoardGameGeek (opens in a new tab)`}
							className="lift group block overflow-hidden rounded-card border border-line bg-surface outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
						>
							<GameCover title={game.name} cover={game.thumbnail} className="aspect-[4/3] w-full" />
							<div className="flex flex-col gap-1.5 p-3">
								<span className="line-clamp-1 text-sm font-medium text-ink">{game.name}</span>
								<span className="numeric flex items-center gap-1 text-[11px] text-muted">
									<StarRating value={game.average} />
									<span className="text-faint">
										· {ownersLabel(game.owners, group.members.length)}
									</span>
								</span>
							</div>
						</a>
					))}
				</div>
			) : (
				<EmptyState
					layout="center"
					title="The shared shelf is empty"
					description="Members' collections appear here once they bind their BGG usernames."
				/>
			)}
		</section>
	);
}
