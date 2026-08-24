import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// AuthContext calls apolloClient.resetStore() after auth changes.
vi.mock("@/lib/graphql/apollo", () => ({
	apolloClient: { resetStore: vi.fn().mockResolvedValue(undefined) },
}));

// Controlled CURRENT_USER hydration query. Sign in/up/out now go through fetch
// (REST), so only the hydration query still touches Apollo.
let queryData: any = null;
let queryError: any = null;

vi.mock("@apollo/client", async () => {
	const actual = await vi.importActual("@apollo/client");
	return {
		...actual,
		useQuery: () => ({ loading: false, data: queryData, error: queryError }),
	};
});

const TOKEN_KEY = "bgg-night-token";
const SESSION_ID_KEY = "bgg-night-session-id";

const mockUser = {
	id: "user-1",
	username: "alex",
	email: "alex@test.com",
	bggUsername: "alex123",
	displayName: "Alex Rivera",
	avatar: null,
	isProvisional: false,
};

/** Queue one fetch response (status + JSON body), matching AuthContext's text()+JSON.parse read. */
function mockFetchOnce(status: number, body: unknown) {
	(global.fetch as any).mockResolvedValueOnce({
		ok: status >= 200 && status < 300,
		status,
		text: async () => (body === undefined ? "" : JSON.stringify(body)),
	});
}

function TestConsumer() {
	const { user, loading, signIn, signOut, error, clearError } = useAuth();

	if (loading) return <div data-testid="loading">Loading…</div>;

	return (
		<div>
			{error !== null && <div data-testid="error">{error}</div>}
			{user ? (
				<>
					<div data-testid="user-id">{user.id}</div>
					<div data-testid="user-name">{user.username}</div>
				</>
			) : (
				<div data-testid="no-user">No user</div>
			)}
			<button data-testid="signin-btn" onClick={() => void signIn("a@b.com", "p").catch(() => {})}>
				Sign In
			</button>
			<button data-testid="signout-btn" onClick={() => void signOut()}>
				Sign Out
			</button>
			<button data-testid="clear-error-btn" onClick={() => clearError()}>
				Clear Error
			</button>
		</div>
	);
}

function renderProvider() {
	return render(
		<AuthProvider>
			<TestConsumer />
		</AuthProvider>,
	);
}

describe("AuthProvider + useAuth (REST)", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
		queryData = null;
		queryError = null;
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("renders children", () => {
		render(
			<AuthProvider>
				<div data-testid="child">Hello</div>
			</AuthProvider>,
		);
		expect(screen.getByTestId("child")).toBeInTheDocument();
	});

	it("has null user and no loading when no token in localStorage", async () => {
		renderProvider();
		await waitFor(() => {
			expect(screen.getByTestId("no-user")).toBeInTheDocument();
		});
	});

	it("hydrates user when currentUser query returns data", async () => {
		localStorage.setItem(TOKEN_KEY, "existing-token");
		queryData = { currentUser: mockUser };
		renderProvider();

		await waitFor(() => {
			expect(screen.getByTestId("user-id")).toBeInTheDocument();
		});
	});

	it("does not clear token on transient query error", async () => {
		localStorage.setItem(TOKEN_KEY, "existing-token");
		queryError = new Error("Network error");
		renderProvider();

		expect(localStorage.getItem(TOKEN_KEY)).toBe("existing-token");
		await waitFor(() => {
			expect(screen.getByTestId("no-user")).toBeInTheDocument();
		});
	});

	it("signIn POSTs /sign_in, stores token + session id, and sets the user", async () => {
		renderProvider();
		await waitFor(() => expect(screen.getByTestId("no-user")).toBeInTheDocument());

		mockFetchOnce(201, { token: "fake-token", sessionId: "sess-9", user: mockUser });

		await act(async () => {
			screen.getByTestId("signin-btn").click();
			await new Promise((r) => setTimeout(r, 0));
		});

		expect(global.fetch).toHaveBeenCalledWith(
			"/sign_in",
			expect.objectContaining({ method: "POST" }),
		);
		expect(screen.getByTestId("user-id")).toHaveTextContent("user-1");
		expect(localStorage.getItem(TOKEN_KEY)).toBe("fake-token");
		expect(localStorage.getItem(SESSION_ID_KEY)).toBe("sess-9");
	});

	it("signOut DELETEs the session and clears local state", async () => {
		localStorage.setItem(TOKEN_KEY, "fake-token");
		localStorage.setItem(SESSION_ID_KEY, "sess-9");
		queryData = { currentUser: mockUser };
		renderProvider();
		await waitFor(() => expect(screen.getByTestId("user-id")).toBeInTheDocument());

		mockFetchOnce(204, undefined);

		await act(async () => {
			screen.getByTestId("signout-btn").click();
			await new Promise((r) => setTimeout(r, 0));
		});

		expect(global.fetch).toHaveBeenCalledWith(
			"/sessions/sess-9",
			expect.objectContaining({ method: "DELETE" }),
		);
		expect(screen.getByTestId("no-user")).toBeInTheDocument();
		expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
		expect(localStorage.getItem(SESSION_ID_KEY)).toBeNull();
	});

	it("signIn sets a humanized error on a 401 failure", async () => {
		renderProvider();
		await waitFor(() => expect(screen.getByTestId("no-user")).toBeInTheDocument());

		mockFetchOnce(401, { error: "Invalid credentials" });

		await act(async () => {
			screen.getByTestId("signin-btn").click();
			await new Promise((r) => setTimeout(r, 0));
		});

		expect(screen.getByTestId("error")).toHaveTextContent("Invalid credentials");
		expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
	});

	it("clearError resets the error state", async () => {
		renderProvider();
		await waitFor(() => expect(screen.getByTestId("no-user")).toBeInTheDocument());

		mockFetchOnce(401, { error: "Invalid credentials" });
		await act(async () => {
			screen.getByTestId("signin-btn").click();
			await new Promise((r) => setTimeout(r, 0));
		});
		expect(screen.getByTestId("error")).toBeInTheDocument();

		await act(async () => {
			screen.getByTestId("clear-error-btn").click();
		});
		await waitFor(() => {
			expect(screen.queryByTestId("error")).not.toBeInTheDocument();
		});
	});

	it("throws when useAuth is used outside AuthProvider", () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(<TestConsumer />)).toThrow("useAuth must be used within AuthProvider");
		consoleSpy.mockRestore();
	});
});
