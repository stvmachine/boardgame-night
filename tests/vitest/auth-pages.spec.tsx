import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { VerifyEmailPage } from "@/pages/VerifyEmailPage";

// authApi -> humanizeAuthError -> AuthContext -> apollo. Stub apollo so importing
// the page modules doesn't open a websocket.
vi.mock("@/lib/graphql/apollo", () => ({
	apolloClient: { resetStore: vi.fn().mockResolvedValue(undefined) },
}));

function mockFetchOnce(status: number, body: unknown) {
	(global.fetch as any).mockResolvedValueOnce({
		ok: status >= 200 && status < 300,
		status,
		text: async () => (body === undefined ? "" : JSON.stringify(body)),
	});
}

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
	global.fetch = vi.fn();
});
afterEach(() => cleanup());

describe("ForgotPasswordPage", () => {
	it("shows a neutral confirmation after submitting (no enumeration)", async () => {
		const user = userEvent.setup();
		mockFetchOnce(202, undefined);

		render(
			<MemoryRouter>
				<ForgotPasswordPage />
			</MemoryRouter>,
		);

		await user.type(screen.getByLabelText("Email"), "someone@example.com");
		await user.click(screen.getByRole("button", { name: /send reset link/i }));

		expect(global.fetch).toHaveBeenCalledWith(
			"/identity/password_reset",
			expect.objectContaining({ method: "POST" }),
		);
		expect(await screen.findByRole("status")).toHaveTextContent(/reset link is on its way/i);
	});
});

describe("ResetPasswordPage", () => {
	it("rejects mismatched passwords before calling the API", async () => {
		const user = userEvent.setup();

		render(
			<MemoryRouter initialEntries={["/reset-password?token=abc"]}>
				<ResetPasswordPage />
			</MemoryRouter>,
		);

		await user.type(screen.getByLabelText("New password"), "password123");
		await user.type(screen.getByLabelText("Confirm password"), "different123");
		await user.click(screen.getByRole("button", { name: /update password/i }));

		expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match");
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it("PATCHes the reset and confirms success on matching passwords", async () => {
		const user = userEvent.setup();
		mockFetchOnce(204, undefined);

		render(
			<MemoryRouter initialEntries={["/reset-password?token=abc"]}>
				<ResetPasswordPage />
			</MemoryRouter>,
		);

		await user.type(screen.getByLabelText("New password"), "brandnew123");
		await user.type(screen.getByLabelText("Confirm password"), "brandnew123");
		await user.click(screen.getByRole("button", { name: /update password/i }));

		expect(global.fetch).toHaveBeenCalledWith(
			"/identity/password_reset",
			expect.objectContaining({ method: "PATCH" }),
		);
		expect(await screen.findByRole("status")).toHaveTextContent(/password has been updated/i);
	});

	it("warns when the token is missing", () => {
		render(
			<MemoryRouter initialEntries={["/reset-password"]}>
				<ResetPasswordPage />
			</MemoryRouter>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent(/missing its token/i);
	});
});

describe("VerifyEmailPage", () => {
	it("verifies with a valid token", async () => {
		mockFetchOnce(204, undefined);

		render(
			<MemoryRouter initialEntries={["/verify-email?token=good"]}>
				<VerifyEmailPage />
			</MemoryRouter>,
		);

		expect(await screen.findByRole("status")).toHaveTextContent(/email address is confirmed/i);
		expect(global.fetch).toHaveBeenCalledWith(
			"/identity/email_verification?sid=good",
			expect.objectContaining({ method: "GET" }),
		);
	});

	it("shows an error for an invalid token", async () => {
		mockFetchOnce(400, { error: "That email verification link is invalid or has expired" });

		render(
			<MemoryRouter initialEntries={["/verify-email?token=bad"]}>
				<VerifyEmailPage />
			</MemoryRouter>,
		);

		expect(await screen.findByRole("alert")).toHaveTextContent(/invalid or has expired/i);
	});
});
