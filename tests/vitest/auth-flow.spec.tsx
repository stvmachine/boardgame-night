import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/contexts/AuthContext";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";

// AuthContext resets the Apollo store on success and hydrates via CURRENT_USER.
vi.mock("@/lib/graphql/apollo", () => ({
	apolloClient: { resetStore: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("@apollo/client", async () => {
	const actual = await vi.importActual("@apollo/client");
	return {
		...actual,
		// No token in these tests → hydration query stays idle.
		useQuery: () => ({ loading: false, data: null, error: undefined }),
	};
});

const mockUser = {
	id: "user-1",
	username: "alex",
	email: "alex@test.com",
	bggUsername: "alex123",
	displayName: "Alex Rivera",
	avatar: null,
	isProvisional: false,
};

/** Queue one fetch response (status + JSON body). */
function mockFetchOnce(status: number, body: unknown) {
	(global.fetch as any).mockResolvedValueOnce({
		ok: status >= 200 && status < 300,
		status,
		text: async () => (body === undefined ? "" : JSON.stringify(body)),
	});
}

// Renders wherever navigation lands so a test can assert the user was (or was
// not) redirected off the auth form.
function LandingProbe() {
	const location = useLocation();
	return <output data-testid="landed">{location.pathname}</output>;
}

function renderAuthApp(initialEntry: string) {
	return render(
		<MemoryRouter initialEntries={[initialEntry]}>
			<AuthProvider>
				<Routes>
					<Route path="/login" element={<LoginPage />} />
					<Route path="/signup" element={<SignupPage />} />
					<Route path="/collection" element={<LandingProbe />} />
				</Routes>
			</AuthProvider>
		</MemoryRouter>,
	);
}

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
	global.fetch = vi.fn();
});

afterEach(() => cleanup());

describe("sign-up failure flow", () => {
	it("shows a readable error and stays on the form when the email is already taken", async () => {
		const user = userEvent.setup();
		mockFetchOnce(422, { email: ["is already taken"] });

		renderAuthApp("/signup");

		await user.type(screen.getByLabelText("Email"), "taken@example.com");
		await user.type(screen.getByLabelText("Password"), "password123");
		await user.type(screen.getByLabelText("BoardGameGeek username"), "alex");
		await user.click(screen.getByRole("button", { name: /create account/i }));

		const alert = await screen.findByRole("alert");
		expect(alert).toHaveTextContent("Email is already taken");
		expect(alert).not.toHaveTextContent('{"email"');

		// Critically: the user is NOT bounced off the form.
		expect(screen.queryByTestId("landed")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
	});

	it("surfaces password validation errors without navigating away", async () => {
		const user = userEvent.setup();
		mockFetchOnce(422, { password: ["must be at least 8 characters"] });

		renderAuthApp("/signup");

		await user.type(screen.getByLabelText("Email"), "new@example.com");
		await user.type(screen.getByLabelText("Password"), "short");
		await user.type(screen.getByLabelText("BoardGameGeek username"), "alex");
		await user.click(screen.getByRole("button", { name: /create account/i }));

		expect(await screen.findByRole("alert")).toHaveTextContent(
			"Password must be at least 8 characters",
		);
		expect(screen.queryByTestId("landed")).not.toBeInTheDocument();
	});
});

describe("log-in failure flow", () => {
	it("shows the error and stays on the login form for wrong credentials", async () => {
		const user = userEvent.setup();
		mockFetchOnce(401, { error: "Invalid credentials" });

		renderAuthApp("/login");

		await user.type(screen.getByLabelText("Email"), "alex@test.com");
		await user.type(screen.getByLabelText("Password"), "wrongpass");
		await user.click(screen.getByRole("button", { name: /^log in$/i }));

		expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
		expect(screen.queryByTestId("landed")).not.toBeInTheDocument();
		expect(screen.getByRole("button", { name: /^log in$/i })).toBeInTheDocument();
	});

	it("navigates to the collection on a successful login (happy path still works)", async () => {
		const user = userEvent.setup();
		mockFetchOnce(201, { token: "tok", sessionId: "sess-1", user: mockUser });

		renderAuthApp("/login");

		await user.type(screen.getByLabelText("Email"), "alex@test.com");
		await user.type(screen.getByLabelText("Password"), "password123");
		await user.click(screen.getByRole("button", { name: /^log in$/i }));

		await waitFor(() => {
			expect(screen.getByTestId("landed")).toHaveTextContent("/collection");
		});
	});
});

describe("stale error isolation between auth pages", () => {
	it("does not carry a failed sign-up error onto the login page", async () => {
		const user = userEvent.setup();
		mockFetchOnce(422, { email: ["is already taken"] });

		render(
			<MemoryRouter initialEntries={["/signup"]}>
				<AuthProvider>
					<Routes>
						<Route
							path="/signup"
							element={
								<>
									<SignupPage />
									<Link to="/login">Go to login</Link>
								</>
							}
						/>
						<Route path="/login" element={<LoginPage />} />
					</Routes>
				</AuthProvider>
			</MemoryRouter>,
		);

		await user.type(screen.getByLabelText("Email"), "taken@example.com");
		await user.type(screen.getByLabelText("Password"), "password123");
		await user.type(screen.getByLabelText("BoardGameGeek username"), "alex");
		await user.click(screen.getByRole("button", { name: /create account/i }));

		expect(await screen.findByRole("alert")).toHaveTextContent("Email is already taken");

		await user.click(screen.getByRole("link", { name: /go to login/i }));

		expect(screen.getByRole("heading", { name: /log in to your group/i })).toBeInTheDocument();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});
