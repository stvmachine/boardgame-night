import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useQuery } from "@apollo/client";
import { apolloClient } from "@/lib/graphql/apollo";
import { CURRENT_USER } from "@/lib/graphql/documents";

export interface AuthUser {
	id: string;
	username: string;
	email: string | null;
	bggUsername: string | null;
	displayName: string;
	avatar: string | null;
	isProvisional: boolean;
}

interface AuthContextType {
	user: AuthUser | null;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string, username: string) => Promise<void>;
	signOut: () => Promise<void>;
	error: string | null;
	clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "bgg-night-token";
const SESSION_ID_KEY = "bgg-night-session-id";

/**
 * Turn a GraphQL/validation error into a human-readable sentence.
 *
 * The backend raises `contract.errors.to_h.to_json` for validation failures,
 * so the raw message arrives as JSON like `{"email":["is already taken"]}`.
 * Rendering that verbatim leaks internals to the user, so we parse it into
 * "Email is already taken". Non-JSON messages (e.g. "Invalid credentials")
 * pass through unchanged.
 */
export function humanizeAuthError(message: string): string {
	const trimmed = message?.trim() ?? "";
	if (!trimmed.startsWith("{")) return trimmed || "Something went wrong";

	try {
		const parsed = JSON.parse(trimmed) as Record<string, unknown>;
		const parts = Object.entries(parsed).map(([field, errors]) => {
			const label = field.charAt(0).toUpperCase() + field.slice(1);
			const detail = Array.isArray(errors) ? errors.join(", ") : String(errors);
			return `${label} ${detail}`;
		});
		return parts.length > 0 ? parts.join(". ") : trimmed;
	} catch {
		return trimmed;
	}
}

/**
 * Turn a REST auth error body into a readable message.
 * - `{ "error": "Invalid credentials" }` (401) → the string, humanized.
 * - `{ "email": ["is already taken"] }` (422 Rails/dry errors) → "Email is
 *   already taken" via the shared humanizeAuthError.
 */
function restErrorMessage(data: unknown, fallback: string): string {
	if (data && typeof data === "object") {
		const record = data as Record<string, unknown>;
		if (typeof record.error === "string") return humanizeAuthError(record.error);
		return humanizeAuthError(JSON.stringify(record));
	}
	return fallback;
}

/** POST JSON to a REST auth endpoint; throw an Error with a humanized message on failure. */
async function authPost(path: string, body: Record<string, unknown>, fallback: string) {
	const response = await fetch(path, {
		method: "POST",
		headers: { "Content-Type": "application/json", Accept: "application/json" },
		body: JSON.stringify(body),
	});
	const text = await response.text();
	const data = text ? JSON.parse(text) : {};
	if (!response.ok) throw new Error(restErrorMessage(data, fallback));
	return data as { token: string; sessionId: string; user: AuthUser };
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [token, setTokenState] = useState(localStorage.getItem(TOKEN_KEY));

	const { data: currentUserData, loading: queryLoading } = useQuery(CURRENT_USER, {
		fetchPolicy: "cache-and-network",
		skip: !token,
	});

	useEffect(() => {
		if (queryLoading) {
			setLoading(true);
			return;
		}

		if (currentUserData?.currentUser) {
			setUser(currentUserData.currentUser);
		} else if (currentUserData?.currentUser === null) {
			// Token was present but the server explicitly returned no user.
			localStorage.removeItem(TOKEN_KEY);
			localStorage.removeItem(SESSION_ID_KEY);
			setTokenState(null);
			setUser(null);
		}

		setLoading(false);
	}, [currentUserData, queryLoading]);

	useEffect(() => {
		if (!token) {
			setUser(null);
			setLoading(false);
		}
	}, [token]);

	const persistSession = useCallback(
		(data: { token: string; sessionId: string; user: AuthUser }) => {
			localStorage.setItem(TOKEN_KEY, data.token);
			localStorage.setItem(SESSION_ID_KEY, data.sessionId);
			setTokenState(data.token);
			setUser(data.user);
		},
		[],
	);

	const signIn = useCallback(
		async (email: string, password: string) => {
			try {
				setError(null);
				const data = await authPost("/sign_in", { email, password }, "Sign in failed");
				persistSession(data);
				await apolloClient.resetStore();
			} catch (err: any) {
				setError(err?.message || "Sign in failed");
				// Re-throw so the caller keeps the user on the form instead of
				// navigating away as if the sign-in had succeeded.
				throw err;
			}
		},
		[persistSession],
	);

	const signUp = useCallback(
		async (email: string, password: string, username: string) => {
			try {
				setError(null);
				// `username` carries the BGG handle from the sign-up form; send it as
				// both the login username and the BGG username.
				const data = await authPost(
					"/sign_up",
					{ email, password, username, bgg_username: username },
					"Sign up failed",
				);
				persistSession(data);
				await apolloClient.resetStore();
			} catch (err: any) {
				setError(err?.message || "Sign up failed");
				// Re-throw so the caller keeps the user on the form instead of
				// navigating away as if the sign-up had succeeded.
				throw err;
			}
		},
		[persistSession],
	);

	const signOut = useCallback(async () => {
		const sessionId = localStorage.getItem(SESSION_ID_KEY);
		const currentToken = localStorage.getItem(TOKEN_KEY);
		try {
			if (sessionId && currentToken) {
				await fetch(`/sessions/${sessionId}`, {
					method: "DELETE",
					headers: { Authorization: `Bearer ${currentToken}` },
				});
			}
		} catch {
			// Sign out even if the request fails (clear local state).
		}
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(SESSION_ID_KEY);
		setTokenState(null);
		setUser(null);
		await apolloClient.resetStore();
	}, []);

	const clearError = useCallback(() => setError(null), []);

	return (
		<AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, error, clearError }}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return ctx;
}
