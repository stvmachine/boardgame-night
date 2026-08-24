import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button, Card, CardContent, Eyebrow } from "@/components/atoms";
import { Field } from "@/components/molecules";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
	const { signIn, error, clearError } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const from = (location.state as { from?: string })?.from || "/collection";

	// Clear any error carried over from another auth page (e.g. a failed sign-up)
	// so a fresh login form never shows a stale, unrelated message.
	useEffect(() => {
		clearError();
	}, [clearError]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (submitting) return;
		setSubmitting(true);
		clearError();
		try {
			await signIn(email, password);
			navigate(from, { replace: true });
		} catch {
			// Error is set in AuthContext, we just stop the spinner
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="w-full max-w-sm">
			<div className="mb-6 flex flex-col items-center gap-2 text-center">
				<Eyebrow>Welcome back</Eyebrow>
				<h1 className="text-h2 text-ink">Log in to your group</h1>
			</div>
			<Card>
				<CardContent className="flex flex-col gap-5 p-6">
					<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
						{error && (
							<p className="text-sm text-bad" role="alert">
								{error}
							</p>
						)}
						<Field
							label="Email"
							id="email"
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							autoComplete="email"
						/>
						<Field
							label="Password"
							id="password"
							type="password"
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							autoComplete="current-password"
						/>
						<Button type="submit" size="lg" disabled={submitting} className="mt-2 w-full">
							{submitting ? (
								<span className="flex items-center gap-2">
									<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									Signing in…
								</span>
							) : (
								"Log in"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
			<p className="mt-4 text-center font-mono text-sm text-muted">
				<Link to="/forgot-password" className="text-primary underline-offset-4 hover:underline">
					Forgot your password?
				</Link>
			</p>
			<p className="mt-2 text-center font-mono text-sm text-muted">
				Don't have an account?{" "}
				<Link to="/signup" className="text-primary underline-offset-4 hover:underline">
					Sign up
				</Link>
			</p>
		</div>
	);
}
