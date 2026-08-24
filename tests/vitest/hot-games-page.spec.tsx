import { MockedProvider } from "@apollo/client/testing";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HotItemsDocument } from "@/generated/operations";
import { HotGamesPage } from "@/pages/HotGamesPage";

const hotItems = Array.from({ length: 8 }, (_, index) => ({
	id: String(200 + index),
	rank: index + 1,
	name: `Hot Game ${index + 1}`,
	yearPublished: 2018 + index,
	thumbnail: `/covers/hot-${index + 1}.png`,
	average: 7.2,
	averageWeight: 2.4,
	minPlayers: 2,
	maxPlayers: 5,
	minPlaytime: 45,
	maxPlaytime: 60,
}));

describe("HotGamesPage", () => {
	it("renders the complete hot list instead of the Home preview slice", async () => {
		render(
			<MockedProvider
				mocks={[
					{
						request: { query: HotItemsDocument },
						result: { data: { hotItems } },
					},
				]}
			>
				<HotGamesPage />
			</MockedProvider>,
		);

		expect(screen.getByRole("heading", { name: "Trending Games" })).toBeInTheDocument();
		expect(await screen.findAllByTestId("trending-card")).toHaveLength(8);
	});

	it("offers a retry action when the hot query fails", async () => {
		render(
			<MockedProvider
				mocks={[
					{
						request: { query: HotItemsDocument },
						error: new Error("offline"),
					},
				]}
			>
				<HotGamesPage />
			</MockedProvider>,
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(/Couldn.t load trending games/);
		expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
	});
});
