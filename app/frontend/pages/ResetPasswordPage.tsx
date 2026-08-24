import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, CardContent, Eyebrow } from "@/components/atoms";
import { Field } from "@/components/molecules";
import { authApi } from "@/lib/authApi";

export function ResetPasswordPage() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const token = searchParams.get("token") ?? "";
	const [password, setPassword] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (submitting) return;
		if (password !== confirmation) {
			setError("Passwords do not match");
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await authApi("PATCH", "/identity/password_reset", {
				body: { sid: token, password, password_confirmation: confirmation },
			});
			setDone(true);
			setTimeout(() => navigate("/login", { replace: true }), 1500);
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
				<h1 className="text-h2 text-ink">Choose a new password</h1>
			</div>
			<Card>
				<CardContent className="flex flex-col gap-5 p-6">
					{!token ? (
						<p className="text-sm text-bad" role="alert">
							This reset link is missing its token. Request a new one from the forgot-password page.
						</p>
					) : done ? (
						<p className="text-sm text-ink" role="status">
							Your password has been updated. Redirecting you to log in…
						</p>
					) : (
						<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
							{error && (
								<p className="text-sm text-bad" role="alert">
									{error}
								</p>
							)}
							<Field
								label="New password"
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
								label="Confirm password"
								id="password-confirmation"
								type="password"
								placeholder="••••••••"
								value={confirmation}
								onChange={(e) => setConfirmation(e.target.value)}
								required
								autoComplete="new-password"
								minLength={8}
							/>
							<Button type="submit" size="lg" disabled={submitting} className="mt-2 w-full">
								{submitting ? "Updating…" : "Update password"}
							</Button>
						</form>
					)}
				</CardContent>
			</Card>
			<p className="mt-6 text-center font-mono text-sm text-muted">
				<Link to="/login" className="text-primary underline-offset-4 hover:underline">
					Back to log in
				</Link>
			</p>
		</div>
	);
}
