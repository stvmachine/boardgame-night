import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";

function normalizeUsername(value: string) {
	return value.trim();
}

function appendUnique(usernames: string[], value: string) {
	const username = normalizeUsername(value);
	if (!username) return usernames;

	const normalized = username.toLocaleLowerCase();
	if (usernames.some((current) => current.toLocaleLowerCase() === normalized)) {
		return usernames;
	}

	return [...usernames, username];
}

/**
 * CollectionMergeForm — the landing hero "try box". A single warm-paper field
 * plus a felt-green "Merge shelves →" action. Extra usernames (added via Enter
 * or comma) collect as chips beneath. Submitting navigates to the merged
 * collection view; the merge logic is unchanged, only the presentation is
 * Felt & Ink.
 */
export function CollectionMergeForm() {
	const navigate = useNavigate();
	const [input, setInput] = useState("");
	const [usernames, setUsernames] = useState<string[]>([]);

	function commitInput() {
		const next = appendUnique(usernames, input);
		setUsernames(next);
		setInput("");
		return next;
	}

	function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key !== "Enter" && event.key !== ",") return;

		event.preventDefault();
		commitInput();
	}

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const next = appendUnique(usernames, input);
		if (next.length === 0) return;

		const params = new URLSearchParams();
		params.set("usernames", next.join(","));
		navigate(`/collection?${params.toString()}`);
	}

	function removeUsername(username: string) {
		setUsernames((current) => current.filter((item) => item !== username));
	}

	return (
		<form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-2.5">
			<div className="flex gap-2">
				<label className="sr-only" htmlFor="collection-username">
					BoardGameGeek username
				</label>
				<Input
					id="collection-username"
					value={input}
					maxLength={64}
					onChange={(event) => setInput(event.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Your BGG username"
					className="flex-1"
				/>
				<Button
					type="submit"
					disabled={usernames.length === 0 && !normalizeUsername(input)}
					className="shrink-0"
				>
					Merge shelves →
				</Button>
			</div>

			{usernames.length > 0 && (
				<ul className="flex flex-wrap gap-2" aria-label="BGG usernames to merge">
					{usernames.map((username) => (
						<li
							key={username.toLocaleLowerCase()}
							className="inline-flex items-center gap-1 rounded-pill bg-primary/10 py-1 pr-1 pl-2.5 text-sm font-medium text-primary"
						>
							{username}
							<button
								type="button"
								onClick={() => removeUsername(username)}
								aria-label={`Remove ${username}`}
								className="press flex size-6 items-center justify-center rounded-pill text-primary hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
							>
								<X className="size-3.5" aria-hidden="true" />
							</button>
						</li>
					))}
				</ul>
			)}

			<span className="numeric text-[11px] text-faint">
				No account needed to try · add friends&rsquo; usernames next
			</span>
		</form>
	);
}
