import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionPage } from "@/pages/SessionPage";

const mocks = vi.hoisted(() => ({
	getNightSession: vi.fn(),
	scheduleSession: vi.fn(),
	startPicking: vi.fn(),
	updateSessionDetails: vi.fn(),
	pickGame: vi.fn(),
	authUser: null as Record<string, unknown> | null,
	authLoading: false,
}));

vi.mock("@/contexts/AuthContext", () => ({
	useAuth: () => ({
		user: mocks.authUser,
		loading: mocks.authLoading,
		signIn: vi.fn(),
		signUp: vi.fn(),
		signOut: vi.fn(),
		error: null,
		clearError: vi.fn(),
	}),
}));

vi.mock("@/generated/operations", () => ({
	useGetNightSessionQuery: (...args: unknown[]) => mocks.getNightSession(...args),
	useScheduleSessionMutation: () => mocks.scheduleSession(),
	useStartPickingMutation: () => mocks.startPicking(),
	useUpdateSessionDetailsMutation: () => mocks.updateSessionDetails(),
	usePickGameMutation: () => mocks.pickGame(),
}));

type GameShape = {
	id: string;
	objectid: string;
	name: string;
	thumbnail: string | null;
	average: number | null;
	minPlayers: number | null;
	maxPlayers: number | null;
	minPlaytime: number | null;
	maxPlaytime: number | null;
	averageWeight: number | null;
	bestPlayerCount: number | null;
	description?: string | null;
};

type SuggestionShape = {
	score: number;
	confidence: "HIGH" | "MEDIUM" | "LOW";
	reasons: string[];
	breakdown: {
		playerCountFit: number;
		timeFit: number;
		complexityFit: number;
		communityRating: number;
		ownershipBonus: number;
	};
	thing: GameShape;
};

type SessionShape = {
	id: string;
	title: string;
	description: string | null;
	state: string;
	scheduledAt: string | null;
	location: string | null;
	capacity: number | null;
	timeBudgetMinutes: number;
	complexityPreference: string;
	attendeeCount: number;
	host: { id: string; displayName: string; avatar: string | null };
	group: { id: string; name: string };
	attendances: Array<{
		id: string;
		response: string;
		respondedAt: string | null;
		user: { id: string; displayName: string; avatar: string | null; bggUsername: string | null };
	}>;
	pickedGame: GameShape | null;
	suggestions: SuggestionShape[] | null;
	scores: never[];
};

function buildHost() {
	return { id: "host-1", displayName: "Alice Host", avatar: null };
}

function buildMember(id: string, name: string, response: string) {
	return {
		id: `att-${id}`,
		response,
		respondedAt: "2026-08-01T12:00:00Z",
		user: { id, displayName: name, avatar: null, bggUsername: null },
	};
}

function buildGame(overrides: Partial<GameShape> = {}): GameShape {
	return {
		id: "game-1",
		objectid: "12345",
		name: "Wingspan",
		thumbnail: null,
		average: 8.1,
		minPlayers: 1,
		maxPlayers: 5,
		minPlaytime: 40,
		maxPlaytime: 70,
		averageWeight: 2.4,
		bestPlayerCount: 3,
		description: "A relaxing engine-builder about birds.",
		...overrides,
	};
}

function buildSuggestion(overrides: Partial<SuggestionShape> = {}): SuggestionShape {
	return {
		score: 0.87,
		confidence: "HIGH",
		reasons: ["Fits player count", "Fits time budget", "Best at 3 players"],
		breakdown: {
			playerCountFit: 1,
			timeFit: 1,
			complexityFit: 0.8,
			communityRating: 0.9,
			ownershipBonus: 0.5,
		},
		thing: buildGame(),
		...overrides,
	};
}

function buildSession(overrides: Partial<SessionShape> = {}): SessionShape {
	return {
		id: "session-1",
		title: "Friday Games",
		description: "A fun night",
		state: "DRAFT",
		scheduledAt: null,
		location: null,
		capacity: null,
		timeBudgetMinutes: 120,
		complexityPreference: "Any",
		attendeeCount: 0,
		host: buildHost(),
		group: { id: "group-1", name: "Night Owls" },
		attendances: [],
		pickedGame: null,
		suggestions: null,
		scores: [],
		...overrides,
	};
}

function renderPage(
	id = "session-1",
	result: { data?: { nightSession: SessionShape }; loading: boolean; error?: Error } = {
		data: { nightSession: buildSession() },
		loading: false,
		error: undefined,
	},
	user: Record<string, unknown> | null = { id: "host-1", displayName: "Alice Host" },
) {
	mocks.authUser = user;
	mocks.authLoading = false;
	mocks.getNightSession.mockReturnValue(result);

	return render(
		<MemoryRouter initialEntries={[`/s/${id}`]}>
			<Routes>
				<Route path="/s/:id" element={<SessionPage />} />
			</Routes>
		</MemoryRouter>,
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.authUser = null;
	mocks.authLoading = false;
	mocks.scheduleSession.mockReturnValue([
		vi.fn(),
		{ loading: false, error: undefined, data: undefined },
	]);
	mocks.startPicking.mockReturnValue([
		vi.fn(),
		{ loading: false, error: undefined, data: undefined },
	]);
	mocks.updateSessionDetails.mockReturnValue([
		vi.fn(),
		{ loading: false, error: undefined, data: undefined },
	]);
	mocks.pickGame.mockReturnValue([vi.fn(), { loading: false, error: undefined, data: undefined }]);
});

describe("SessionPage loading and missing states", () => {
	it("renders a loading skeleton while the session query is loading", () => {
		const { container } = renderPage("session-1", { data: undefined, loading: true });

		expect(container.querySelector(".skeleton")).toBeInTheDocument();
		expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
	});

	it("renders a safe not-found state when the session is missing", () => {
		renderPage("session-1", { data: undefined, loading: false, error: new Error("Not found") });

		expect(screen.getByRole("heading", { name: "Session not found" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/");
	});

	it("renders a safe not-found state when the query returns null", () => {
		renderPage("session-1", {
			data: { nightSession: null as unknown as SessionShape },
			loading: false,
		});

		expect(screen.getByRole("heading", { name: "Session not found" })).toBeInTheDocument();
	});
});

describe("SessionPage DRAFT state", () => {
	it("shows the session title, badge, host, and metadata", () => {
		renderPage();

		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Friday Games");
		expect(screen.getByText("DRAFT")).toBeInTheDocument();
		expect(screen.getByText(/Hosted by/)).toHaveTextContent("Hosted by Alice Host");
		expect(screen.getByText(/Location TBD/)).toBeInTheDocument();
	});

	it("lets the host schedule the session with location and capacity", async () => {
		const mutate = vi.fn().mockResolvedValue({
			data: {
				scheduleSession: {
					invitesSent: 2,
					session: buildSession({
						state: "INVITED",
						scheduledAt: "2026-08-07T18:00:00Z",
						location: "Clubhouse",
						capacity: 6,
					}),
				},
			},
		});
		mocks.scheduleSession.mockReturnValue([
			mutate,
			{ loading: false, error: undefined, data: undefined },
		]);

		const user = userEvent.setup();
		renderPage();

		await user.type(screen.getByLabelText("Location"), "Clubhouse");
		await user.type(screen.getByLabelText("Capacity"), "6");
		await user.click(screen.getByRole("button", { name: "Schedule & send invites" }));

		await waitFor(() => expect(mutate).toHaveBeenCalled());
		expect(mutate).toHaveBeenCalledWith(
			expect.objectContaining({
				variables: expect.objectContaining({
					sessionId: "session-1",
					location: "Clubhouse",
					capacity: 6,
				}),
			}),
		);

		// After mutation the returned state drives the UI.
		await waitFor(() => expect(screen.getByText("INVITED")).toBeInTheDocument());
	});

	it("does not render host-only schedule controls for non-hosts", () => {
		renderPage(
			"session-1",
			{ data: { nightSession: buildSession() }, loading: false },
			{ id: "member-1", displayName: "Bob Member" },
		);

		expect(
			screen.queryByRole("button", { name: "Schedule & send invites" }),
		).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Location")).not.toBeInTheDocument();
	});

	it("displays a schedule mutation error without discarding input", async () => {
		const mutate = vi.fn().mockRejectedValue(new Error("Server error"));
		mocks.scheduleSession.mockReturnValue([
			mutate,
			{ loading: false, error: undefined, data: undefined },
		]);

		const user = userEvent.setup();
		renderPage();

		await user.type(screen.getByLabelText("Location"), "Clubhouse");
		await user.click(screen.getByRole("button", { name: "Schedule & send invites" }));

		await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/could not schedule/i));
		expect(screen.getByLabelText("Location")).toHaveValue("Clubhouse");
	});
});

describe("SessionPage INVITED state", () => {
	it("shows Start picking for the host", () => {
		renderPage("session-1", {
			data: {
				nightSession: buildSession({ state: "INVITED", scheduledAt: "2026-08-07T18:00:00Z" }),
			},
			loading: false,
		});

		expect(screen.getByText("INVITED")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Start picking" })).toBeInTheDocument();
	});

	it("does not show Start picking for members", () => {
		renderPage(
			"session-1",
			{
				data: {
					nightSession: buildSession({ state: "INVITED", scheduledAt: "2026-08-07T18:00:00Z" }),
				},
				loading: false,
			},
			{ id: "member-1", displayName: "Bob Member" },
		);

		expect(screen.queryByRole("button", { name: "Start picking" })).not.toBeInTheDocument();
	});

	it("transitions to PICKING when the host starts picking", async () => {
		const mutate = vi.fn().mockResolvedValue({
			data: {
				startPicking: { session: buildSession({ state: "PICKING" }) },
			},
		});
		mocks.startPicking.mockReturnValue([
			mutate,
			{ loading: false, error: undefined, data: undefined },
		]);

		const user = userEvent.setup();
		renderPage("session-1", {
			data: {
				nightSession: buildSession({ state: "INVITED", scheduledAt: "2026-08-07T18:00:00Z" }),
			},
			loading: false,
		});

		await user.click(screen.getByRole("button", { name: "Start picking" }));

		await waitFor(() =>
			expect(mutate).toHaveBeenCalledWith(
				expect.objectContaining({ variables: { sessionId: "session-1" } }),
			),
		);
		await waitFor(() => expect(screen.getByText("PICKING")).toBeInTheDocument());
	});
});

describe("SessionPage PICKING state", () => {
	it("shows suggestions, budget, complexity, and Edit Details for the host", () => {
		renderPage("session-1", {
			data: {
				nightSession: buildSession({
					state: "PICKING",
					scheduledAt: "2026-08-07T18:00:00Z",
					attendeeCount: 3,
					suggestions: [buildSuggestion()],
				}),
			},
			loading: false,
		});

		expect(screen.getByText("PICKING")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Ranked for tonight" })).toBeInTheDocument();
		// The night's table (players / time budget / complexity) in the sidebar.
		expect(screen.getByText("Time budget")).toBeInTheDocument();
		expect(screen.getByText("120m")).toBeInTheDocument();
		expect(screen.getByText("Any")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Edit constraints" })).toBeInTheDocument();
		expect(screen.getByTestId("suggestion-grid")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Pick this game" })).toBeInTheDocument();
	});

	it("hides host controls from members and shows the host-will-choose message", () => {
		renderPage(
			"session-1",
			{
				data: {
					nightSession: buildSession({
						state: "PICKING",
						scheduledAt: "2026-08-07T18:00:00Z",
						attendeeCount: 3,
						suggestions: [buildSuggestion()],
					}),
				},
				loading: false,
			},
			{ id: "member-1", displayName: "Bob Member" },
		);

		expect(screen.queryByRole("button", { name: "Edit constraints" })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Pick this game" })).not.toBeInTheDocument();
		expect(screen.getByText("The host will choose the game.")).toBeInTheDocument();
	});

	it("shows an empty state when there are no confirmed players", () => {
		renderPage("session-1", {
			data: {
				nightSession: buildSession({
					state: "PICKING",
					scheduledAt: "2026-08-07T18:00:00Z",
					attendeeCount: 0,
					suggestions: [],
				}),
			},
			loading: false,
		});

		expect(screen.getByText(/No confirmed players yet/)).toBeInTheDocument();
	});

	it("shows an empty state when no games fit the night", () => {
		renderPage("session-1", {
			data: {
				nightSession: buildSession({
					state: "PICKING",
					scheduledAt: "2026-08-07T18:00:00Z",
					attendeeCount: 3,
					suggestions: [],
				}),
			},
			loading: false,
		});

		expect(screen.getByText("No games fit this night")).toBeInTheDocument();
	});

	it("lets the host edit ordinary details without changing preferences", async () => {
		const mutate = vi.fn().mockResolvedValue({
			data: {
				updateSessionDetails: {
					session: buildSession({
						state: "PICKING",
						scheduledAt: "2026-08-07T18:00:00Z",
						title: "Updated Picking Night",
						description: "Updated description",
						location: "Updated Hall",
						capacity: 8,
					}),
				},
			},
		});
		mocks.updateSessionDetails.mockReturnValue([
			mutate,
			{ loading: false, error: undefined, data: undefined },
		]);

		const user = userEvent.setup();
		renderPage("session-1", {
			data: {
				nightSession: buildSession({
					state: "PICKING",
					scheduledAt: "2026-08-07T18:00:00Z",
					attendeeCount: 3,
					suggestions: [buildSuggestion()],
				}),
			},
			loading: false,
		});

		await user.click(screen.getByRole("button", { name: "Edit constraints" }));
		expect(screen.getByRole("dialog", { name: "Edit session details" })).toBeInTheDocument();
		expect(screen.getByText("Game preferences stay locked while picking.")).toBeInTheDocument();

		await user.clear(screen.getByLabelText("Title"));
		await user.type(screen.getByLabelText("Title"), "Updated Picking Night");
		await user.click(screen.getByRole("button", { name: "Save details" }));

		await waitFor(() => expect(mutate).toHaveBeenCalled());
		await waitFor(() =>
			expect(
				screen.queryByRole("dialog", { name: "Edit session details" }),
			).not.toBeInTheDocument(),
		);
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Updated Picking Night");
	});

	it("preserves edit form values when the mutation fails", async () => {
		const mutate = vi.fn().mockRejectedValue(new Error("Update failed"));
		mocks.updateSessionDetails.mockReturnValue([
			mutate,
			{ loading: false, error: undefined, data: undefined },
		]);

		const user = userEvent.setup();
		renderPage("session-1", {
			data: {
				nightSession: buildSession({
					state: "PICKING",
					scheduledAt: "2026-08-07T18:00:00Z",
					attendeeCount: 3,
					suggestions: [buildSuggestion()],
				}),
			},
			loading: false,
		});

		await user.click(screen.getByRole("button", { name: "Edit constraints" }));
		await user.clear(screen.getByLabelText("Title"));
		await user.type(screen.getByLabelText("Title"), "Updated Picking Night");
		await user.click(screen.getByRole("button", { name: "Save details" }));

		await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/could not save/i));
		expect(screen.getByLabelText("Title")).toHaveValue("Updated Picking Night");
	});

	it("transitions to COMPLETED when the host picks a game", async () => {
		const mutate = vi.fn().mockResolvedValue({
			data: {
				pickGame: {
					session: buildSession({
						state: "COMPLETED",
						scheduledAt: "2026-08-07T18:00:00Z",
						attendeeCount: 3,
						pickedGame: buildGame({ name: "Wingspan" }),
						suggestions: null,
					}),
				},
			},
		});
		mocks.pickGame.mockReturnValue([mutate, { loading: false, error: undefined, data: undefined }]);

		const user = userEvent.setup();
		renderPage("session-1", {
			data: {
				nightSession: buildSession({
					state: "PICKING",
					scheduledAt: "2026-08-07T18:00:00Z",
					attendeeCount: 3,
					suggestions: [
						buildSuggestion({ thing: buildGame({ name: "Wingspan", objectid: "12345" }) }),
					],
				}),
			},
			loading: false,
		});

		await user.click(screen.getByRole("button", { name: "Pick this game" }));

		await waitFor(() =>
			expect(mutate).toHaveBeenCalledWith(
				expect.objectContaining({ variables: { sessionId: "session-1", gameId: "game-1" } }),
			),
		);
		await waitFor(() => expect(screen.getByText("COMPLETED")).toBeInTheDocument());
		expect(screen.getByText("Played on the night")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Wingspan" })).toBeInTheDocument();
	});
});
