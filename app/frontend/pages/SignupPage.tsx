import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, CardContent, Eyebrow } from "@/components/atoms";
import { Field } from "@/components/molecules";
import { useAuth } from "@/contexts/AuthContext";

export function SignupPage() {
	const { signUp, error, clearError } = useAuth();
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [bggUsername, setBggUsername] = useState("");
	const [submitting, setSubmitting] = useState(false);

	// Clear any error carried over from another auth page (e.g. a failed login)
	// so a fresh sign-up form never shows a stale, unrelated message.
	useEffect(() => {
		clearError();
	}, [clearError]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (submitting) return;
		setSubmitting(true);
		clearError();
		try {
			// signUp mutation takes (email, password, username) where username is the BGG username
			await signUp(email, password, bggUsername);
			navigate("/collection", { replace: true });
		} catch {
			// Error is set in AuthContext, we just stop the spinner
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="w-full max-w-sm">
			<div className="mb-6 flex flex-col items-center gap-2 text-center">
				<Eyebrow>Get started</Eyebrow>
				<h1 className="text-h2 text-ink">Create your account</h1>
				<p className="text-sm text-muted">Bring your BGG username. Takes about a minute.</p>
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
							label="Name"
							id="name"
							type="text"
							placeholder="Alex Rivera"
							value={name}
							onChange={(e) => setName(e.target.value)}
							autoComplete="name"
						/>
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
							autoComplete="new-password"
							minLength={8}
						/>
						<Field
							label="BoardGameGeek username"
							id="bgg"
							type="text"
							placeholder="alex123"
							value={bggUsername}
							onChange={(e) => setBggUsername(e.target.value)}
							required
						/>
						<Button type="submit" size="lg" disabled={submitting} className="mt-2 w-full">
							{submitting ? (
								<span className="flex items-center gap-2">
									<span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
									Creating account…
								</span>
							) : (
								"Create account"
							)}
						</Button>
					</form>
				</CardContent>
			</Card>
			<p className="mt-6 text-center font-mono text-sm text-muted">
				Already have an account?{" "}
				<Link to="/login" className="text-primary underline-offset-4 hover:underline">
					Log in
				</Link>
			</p>
		</div>
	);
}
