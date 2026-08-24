import { useEffect, useRef, useState } from "react";
import { Button, Card, Eyebrow, Input } from "@/components/atoms";
import { useInviteToGroupMutation, type GetGroupQuery } from "@/generated/operations";

type Group = NonNullable<GetGroupQuery["group"]>;

/**
 * InvitePanel — the "Grow the shelf" inset card. Surfaces the copyable invite
 * link and an email-invite form; every member added merges another BGG
 * collection into the group shelf.
 */
export function InvitePanel({ group }: { group: Group }) {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
	const [copied, setCopied] = useState(false);
	const [copyError, setCopyError] = useState<string | null>(null);
	const [inviteError, setInviteError] = useState<string | null>(null);
	const copyFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [inviteToGroup, { loading: inviting }] = useInviteToGroupMutation();
	const groupToken = group.inviteCode ?? group.id;
	const inviteLink = `${window.location.origin}/g/${encodeURIComponent(groupToken)}`;

	useEffect(
		() => () => {
			if (copyFeedbackTimer.current) clearTimeout(copyFeedbackTimer.current);
		},
		[],
	);

	const handleCopy = async () => {
		setCopyError(null);
		try {
			await navigator.clipboard.writeText(inviteLink);
			setCopied(true);
			if (copyFeedbackTimer.current) clearTimeout(copyFeedbackTimer.current);
			copyFeedbackTimer.current = setTimeout(() => setCopied(false), 2_000);
		} catch {
			setCopied(false);
			setCopyError("Could not copy the invite link.");
		}
	};

	const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const normalizedEmail = email.trim();
		setInviteError(null);
		if (!normalizedEmail) {
			setInviteError("Enter an email address.");
			return;
		}

		try {
			await inviteToGroup({
				variables: { email: normalizedEmail, groupId: group.id, role },
			});
			setEmail("");
			setRole("MEMBER");
		} catch (error) {
			setInviteError(error instanceof Error ? error.message : "Could not send this invitation.");
		}
	};

	return (
		<Card tone="inset" className="flex flex-col gap-3 p-4">
			<Eyebrow>Grow the shelf</Eyebrow>
			<p className="text-[13px] leading-relaxed text-ink-2">
				Every member you add merges another BGG collection into the group shelf.
			</p>

			<div>
				<label htmlFor="group-invite-link" className="sr-only">
					Invite link
				</label>
				<div className="flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5">
					<span className="numeric min-w-0 flex-1 truncate text-xs text-muted">{inviteLink}</span>
					<input id="group-invite-link" readOnly value={inviteLink} className="sr-only" />
					<Button variant="link" size="sm" onClick={handleCopy} className="numeric shrink-0">
						{copied ? "COPIED" : "COPY"}
					</Button>
				</div>
				<div className="mt-1 min-h-4 text-xs" aria-live="polite">
					{copyError ? <span className="text-bad">{copyError}</span> : null}
				</div>
			</div>

			<form className="flex flex-col gap-2" onSubmit={handleInvite} noValidate>
				{group.myRole === "OWNER" ? (
					<label className="text-sm font-medium text-ink">
						<span className="sr-only">Role</span>
						<select
							aria-label="Role"
							value={role}
							onChange={(event) => setRole(event.target.value as "MEMBER" | "ADMIN")}
							className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/25"
						>
							<option value="MEMBER">Member</option>
							<option value="ADMIN">Admin</option>
						</select>
					</label>
				) : null}

				<div className="flex gap-2">
					<label htmlFor="group-invite-email" className="sr-only">
						Email address
					</label>
					<Input
						id="group-invite-email"
						type="email"
						placeholder="Email address"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						className="h-9 flex-1 text-sm"
					/>
					<Button type="submit" variant="ink" size="sm" disabled={inviting}>
						{inviting ? "Sending…" : "Invite"}
					</Button>
				</div>

				{inviteError ? (
					<p className="text-sm text-bad" role="alert">
						{inviteError}
					</p>
				) : null}
			</form>
		</Card>
	);
}
