import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { Card, Eyebrow } from "@/components/atoms";
import { HEALTH_CHECK } from "@/lib/graphql/documents";

export function HealthPage() {
	const { data, loading, error } = useQuery(HEALTH_CHECK);
	const [corsErrors, setCorsErrors] = useState<string[]>([]);

	useEffect(() => {
		const handler = (event: ErrorEvent) => {
			if (/Access-Control|CORS/i.test(event.message)) {
				setCorsErrors((prev) => [...prev, event.message]);
			}
		};
		window.addEventListener("error", handler);
		return () => window.removeEventListener("error", handler);
	}, []);

	return (
		<div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:px-6">
			<div className="flex flex-col gap-2">
				<Eyebrow>Diagnostics</Eyebrow>
				<h1 className="text-h1 text-ink">Server Health</h1>
			</div>
			<Card className="flex flex-col gap-3 p-6">
				{loading && <p className="text-muted">Checking…</p>}
				{error && (
					<div
						className="rounded-md border border-bad/30 bg-bad-bg px-3 py-2 text-sm text-bad"
						role="alert"
					>
						{error.message}
					</div>
				)}
				{!loading && !error && (
					<div className="flex items-center gap-2 text-ink">
						<span className="inline-flex size-3 rounded-pill bg-good" aria-hidden="true" />
						<span className="font-medium">{data?.health ?? "unknown"}</span>
					</div>
				)}
				{corsErrors.length > 0 && (
					<div
						className="rounded-md border border-bad/30 bg-bad-bg px-3 py-2 text-sm whitespace-pre-line text-bad"
						role="alert"
					>
						{corsErrors.join("\n")}
					</div>
				)}
			</Card>
		</div>
	);
}
