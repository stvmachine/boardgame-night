/**
 * AppFooter — the quiet one-line footer for authenticated screens. The
 * marketing footer belongs on public pages; inside the app, a night ends with
 * one line of legal + version, nothing more.
 */
export function AppFooter({ version = "v1.0" }: { version?: string }) {
	return (
		<footer className="border-t border-line">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
				<p>Not affiliated with BoardGameGeek.</p>
				<p className="numeric">
					© {new Date().getFullYear()} BoardGameNight · {version}
				</p>
			</div>
		</footer>
	);
}
