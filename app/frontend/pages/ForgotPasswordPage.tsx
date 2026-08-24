import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, CardContent, Eyebrow } from "@/components/atoms";
import { Field } from "@/components/molecules";
import { authApi } from "@/lib/authApi";

export function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (submitting) return;
		setSubmitting(true);
		setError(null);
		try {
			// Always 202 (no account enumeration); show the same confirmation regardless.
			await authApi("POST", "/identity/password_reset", { body: { email } });
			setSent(true);
		} catch (err: any) {
			setError(err?.message || "Something went wrong");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="w-full max-w-sm">
			<div className="mb-6 flex flex-col items-center gap-2 text-center">
				<Eyebrow>Reset password</Eyebrow>
				<h1 className="text-h2 text-ink">Forgot your password?</h1>
				<p className="text-sm text-muted">
					Enter your email and we&rsquo;ll send you a link to set a new one.
				</p>
			</div>
			<Card>
				<CardContent className="flex flex-col gap-5 p-6">
					{sent ? (
						<p className="text-sm text-ink" role="status">
							If an account exists for <strong>{email}</strong>, a reset link is on its way. Check
							your inbox and follow the link within 20 minutes.
						</p>
					) : (
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
							<Button type="submit" size="lg" disabled={submitting} className="mt-2 w-full">
								{submitting ? "Sending…" : "Send reset link"}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>
			<p className="mt-6 text-center font-mono text-sm text-muted">
				Remembered it?{" "}
				<Link to="/login" className="text-primary underline-offset-4 hover:underline">
					Log in
				</Link>
			</p>
		</div>
	);
}
