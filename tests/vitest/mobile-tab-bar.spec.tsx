import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { MobileTabBar } from "@/components/organisms/mobile-tab-bar";
import { ActiveGroupProvider } from "@/contexts/ActiveGroupContext";

function renderTabBar(initialPath = "/") {
	return render(
		<MemoryRouter initialEntries={[initialPath]}>
			<ActiveGroupProvider>
				<MobileTabBar />
				<Routes>
					<Route path="*" element={<LocationProbe />} />
				</Routes>
			</ActiveGroupProvider>
		</MemoryRouter>,
	);
}

// Renders the current pathname so we can assert where the "+" button navigates.
import { useLocation } from "react-router-dom";
function LocationProbe() {
	const { pathname, search } = useLocation();
	return <div data-testid="location">{pathname + search}</div>;
}

beforeEach(() => {
	localStorage.clear();
});

describe("MobileTabBar", () => {
	it("renders the five primary destinations without an active group", () => {
		renderTabBar();

		expect(screen.getByRole("link", { name: /Shelf/ })).toHaveAttribute("href", "/collection");
		expect(screen.getByRole("link", { name: /Groups/ })).toHaveAttribute("href", "/groups");
		expect(screen.getByRole("link", { name: /Tonight/ })).toHaveAttribute("href", "/groups");
		expect(screen.getByRole("link", { name: /You/ })).toHaveAttribute("href", "/account");
		expect(screen.getByRole("button", { name: "Create a night" })).toBeInTheDocument();
	});

	it("derives shelf and tonight routes from the active group token", () => {
		localStorage.setItem(
			"bgg-night-active-group",
			JSON.stringify({ token: "NIGHTOWLS", name: "Night Owls", bggUsernames: ["alex"] }),
		);
		renderTabBar();

		expect(screen.getByRole("link", { name: /Shelf/ })).toHaveAttribute(
			"href",
			"/collection?group=NIGHTOWLS",
		);
		expect(screen.getByRole("link", { name: /Tonight/ })).toHaveAttribute("href", "/g/NIGHTOWLS");
	});

	it("marks the active destination with aria-current", () => {
		renderTabBar("/collection");
		expect(screen.getByRole("link", { name: /Shelf/ })).toHaveAttribute("aria-current", "page");
		expect(screen.getByRole("link", { name: /Groups/ })).not.toHaveAttribute("aria-current");
	});

	it("creates a night at /groups when no group is active", async () => {
		const user = userEvent.setup();
		renderTabBar();

		await user.click(screen.getByRole("button", { name: "Create a night" }));
		expect(screen.getByTestId("location")).toHaveTextContent("/groups");
	});

	it("creates a night in the active group when one is selected", async () => {
		localStorage.setItem(
			"bgg-night-active-group",
			JSON.stringify({ token: "NIGHTOWLS", name: "Night Owls", bggUsernames: ["alex"] }),
		);
		const user = userEvent.setup();
		renderTabBar();

		await user.click(screen.getByRole("button", { name: "Create a night" }));
		expect(screen.getByTestId("location")).toHaveTextContent("/g/NIGHTOWLS");
	});
});
