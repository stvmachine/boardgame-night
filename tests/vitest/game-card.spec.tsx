import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GameCard } from "@/components/molecules/game-card";
import { RankedGameCard, RankedGameRow } from "@/components/molecules";
import { games } from "./fixtures/sample-data";
import type { Suggestion } from "@/lib/data";

const game = {
	...games[0],
	description: "Build a thriving preserve with cards & clever combos.",
	lastPlayedAt: "2026-07-18T18:00:00Z",
};

const baseSuggestion: Suggestion = {
	gameId: game.id,
	match: 87,
	votes: 4,
	confidence: "HIGH",
	reasons: [
		{ ok: true, label: "Fits player count" },
		{ ok: true, label: "Fits time budget" },
		{ ok: true, label: "Best at 1 player" },
		{ ok: true, label: "Owned by group" },
	],
};

describe("GameCard", () => {
	it.each(["grid", "list"] as const)(
		"renders complete shelf-card anatomy in the %s variant",
		(variant) => {
			render(<GameCard game={game} variant={variant} />);

			const card = screen.getByTestId("game-card");
			expect(card).toHaveAttribute("data-variant", variant);
			expect(card.tagName).toBe("ARTICLE");
			expect(within(card).getByRole("img")).toHaveAttribute("src", game.cover);
			expect(within(card).getByRole("img")).toHaveAttribute("alt", "Feathered Realms box cover");
			// Gold rating badge on the cover.
			expect(within(card).getByText("8.1")).toBeInTheDocument();
			expect(within(card).getByTestId("game-description")).toHaveTextContent(game.description);
			expect(within(card).getByLabelText("Owned by alex, sam, jordan")).toBeInTheDocument();

			const footer = within(card).getByTestId("game-card-footer");
			expect(within(footer).getByText("1–5")).toBeInTheDocument();
			expect(within(footer).getByText("60m")).toBeInTheDocument();
			expect(within(footer).getByText("wt 2.4")).toBeInTheDocument();
		},
	);

	it("uses one isolated overlay link with the real BGG identity", () => {
		render(<GameCard game={game} />);

		const card = screen.getByTestId("game-card");
		const link = within(card).getByRole("link", {
			name: "View Feathered Realms on BoardGameGeek",
		});

		expect(card).not.toHaveAttribute("role", "button");
		expect(card).not.toHaveAttribute("tabindex");
		expect(within(card).getAllByRole("link")).toHaveLength(1);
		expect(link).toHaveAttribute(
			"href",
			`https://boardgamegeek.com/boardgame/${encodeURIComponent(game.id)}`,
		);
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("honours an explicit href override on the overlay link", () => {
		render(<GameCard game={game} href="/g/NIGHTOWLS/games/feathered-realms" />);

		const card = screen.getByTestId("game-card");
		expect(within(card).getByTestId("game-card-link")).toHaveAttribute(
			"href",
			"/g/NIGHTOWLS/games/feathered-realms",
		);
	});

	it("renders description as escaped plain text", () => {
		const { container } = render(
			<GameCard game={{ ...game, description: "<strong>Not markup</strong>" }} />,
		);

		expect(screen.getByTestId("game-description")).toHaveTextContent("<strong>Not markup</strong>");
		expect(container.querySelector("strong")).toBeNull();
	});

	it("renders a strong cover fallback instead of a broken image", () => {
		render(<GameCard game={{ ...game, cover: "" }} />);

		const card = screen.getByTestId("game-card");
		expect(within(card).queryByRole("img")).not.toBeInTheDocument();
		// Felt-weave fallback shows the title initials and an honest note.
		expect(within(card).getByText("FR")).toBeInTheDocument();
		expect(within(card).getByText("no cover on BGG")).toBeInTheDocument();
	});

	it("caps the visible owner stack and announces overflow", () => {
		render(<GameCard game={{ ...game, owners: ["alex", "sam", "jordan", "riley", "casey"] }} />);

		const owners = screen.getByLabelText("Owned by alex, sam, jordan, riley, casey");
		expect(within(owners).getByText("+2")).toBeInTheDocument();
	});

	it("marks the game selected for tonight", () => {
		render(<GameCard game={game} selected />);
		expect(screen.getByText("PLAYING TONIGHT")).toBeInTheDocument();
	});

	it("accepts a className on the article", () => {
		render(<GameCard game={game} className="custom-class" />);
		expect(screen.getByTestId("game-card")).toHaveClass("custom-class");
	});
});

describe("RankedGameCard", () => {
	it("renders the rank, match score, confidence, and reason chips", () => {
		render(<RankedGameCard game={game} suggestion={baseSuggestion} rank={1} />);

		const card = screen.getByTestId("ranked-game-card");
		expect(within(card).getByText("#1")).toBeInTheDocument();
		expect(within(card).getByText("87")).toBeInTheDocument();
		expect(within(card).getByText("HIGH CONFIDENCE")).toBeInTheDocument();
		expect(within(card).getByText(/Fits player count/)).toBeInTheDocument();
		expect(within(card).getByText(/Fits time budget/)).toBeInTheDocument();
		expect(within(card).getByText(/Best at 1 player/)).toBeInTheDocument();
	});

	it("exposes remaining reasons through a keyboard-operable disclosure", async () => {
		const user = userEvent.setup();
		const suggestion: Suggestion = {
			...baseSuggestion,
			reasons: [...baseSuggestion.reasons, { ok: true, label: "Community favourite" }],
		};
		render(<RankedGameCard game={game} suggestion={suggestion} />);

		const card = screen.getByTestId("ranked-game-card");
		const toggle = within(card).getByTestId("show-more-reasons");
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(within(card).queryByText(/Community favourite/)).not.toBeInTheDocument();

		await user.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "true");
		expect(within(card).getByText(/Community favourite/)).toBeInTheDocument();

		await user.click(toggle);
		expect(toggle).toHaveAttribute("aria-expanded", "false");
		expect(within(card).queryByText(/Community favourite/)).not.toBeInTheDocument();
	});

	it("shows a host-only pick button that calls onPick", async () => {
		const user = userEvent.setup();
		const onPick = vi.fn();
		render(<RankedGameCard game={game} suggestion={baseSuggestion} isHost onPick={onPick} />);

		await user.click(screen.getByRole("button", { name: "Pick this game" }));
		expect(onPick).toHaveBeenCalledOnce();
	});

	it("disables the pick button and surfaces an error while picking", () => {
		render(
			<RankedGameCard
				game={game}
				suggestion={baseSuggestion}
				isHost
				onPick={vi.fn()}
				picking
				pickError="Could not save pick"
			/>,
		);

		expect(screen.getByRole("button", { name: /Picking/i })).toBeDisabled();
		expect(screen.getByRole("alert")).toHaveTextContent("Could not save pick");
	});

	it("tells members the host will choose and hides the pick button", () => {
		render(<RankedGameCard game={game} suggestion={baseSuggestion} isHost={false} />);

		const card = screen.getByTestId("ranked-game-card");
		expect(within(card).getByText("The host will choose the game.")).toBeInTheDocument();
		expect(within(card).queryByRole("button", { name: "Pick this game" })).not.toBeInTheDocument();
	});
});

describe("RankedGameRow", () => {
	it("renders the rank and match score with a host pick button", async () => {
		const user = userEvent.setup();
		const onPick = vi.fn();
		render(
			<RankedGameRow game={game} suggestion={baseSuggestion} rank={2} isHost onPick={onPick} />,
		);

		const row = screen.getByTestId("ranked-game-row");
		expect(within(row).getByText("#2")).toBeInTheDocument();
		expect(within(row).getByText("87")).toBeInTheDocument();

		await user.click(within(row).getByRole("button", { name: "Pick" }));
		expect(onPick).toHaveBeenCalledOnce();
	});

	it("hides the pick button from members", () => {
		render(<RankedGameRow game={game} suggestion={baseSuggestion} rank={2} isHost={false} />);

		const row = screen.getByTestId("ranked-game-row");
		expect(within(row).queryByRole("button", { name: "Pick" })).not.toBeInTheDocument();
	});
});
