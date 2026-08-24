import { MockedProvider } from "@apollo/client/testing";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { HotItemsDocument } from "@/generated/operations";
import { LandingPage } from "@/pages/LandingPage";

const hotItems = Array.from({ length: 8 }, (_, index) => ({
	id: String(100 + index),
	rank: index + 1,
	name: `Trending Game ${index + 1}`,
	yearPublished: 2020 + index,
	thumbnail: `/covers/trending-${index + 1}.png`,
	average: 7.1 + index / 10,
	averageWeight: 2.1 + index / 10,
	minPlayers: 2,
	maxPlayers: 4,
	minPlaytime: 30,
	maxPlaytime: 60,
}));

const mocks = [
	{
		request: { query: HotItemsDocument },
		result: { data: { hotItems } },
	},
];

beforeAll(() => {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation(() => ({
			matches: true,
			media: "(prefers-reduced-motion: reduce)",
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});
});

function LocationProbe() {
	const location = useLocation();
	return <output>{`${location.pathname}${location.search}`}</output>;
}

function renderHome() {
	return render(
		<MockedProvider mocks={mocks}>
			<MemoryRouter initialEntries={["/"]}>
				<Routes>
					<Route path="/" element={<LandingPage />} />
					<Route path="/collection" element={<LocationProbe />} />
				</Routes>
			</MemoryRouter>
		</MockedProvider>,
	);
}

describe("LandingPage", () => {
	it("lets an anonymous visitor merge collections from the hero try box", async () => {
		const user = userEvent.setup();
		renderHome();

		const input = screen.getByPlaceholderText("Your BGG username");
		await user.type(input, " e2e_alice ");
		await user.keyboard("{Enter}");

		// The username collects as a trimmed chip beneath the field.
		expect(screen.getByText("e2e_alice")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /Merge shelves/ }));

		expect(await screen.findByText("/collection?usernames=e2e_alice")).toBeInTheDocument();
	});

	it("renders the live six-card trending preview", async () => {
		renderHome();

		expect(await screen.findByRole("heading", { name: "Trending on BGG" })).toBeInTheDocument();
		expect(screen.getAllByTestId("trending-card")).toHaveLength(6);
		expect(screen.getByRole("link", { name: "See all 50" })).toHaveAttribute("href", "/hot");
	});
});
