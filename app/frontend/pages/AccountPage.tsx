import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Eyebrow,
	SegmentedControl,
	type Segment,
} from "@/components/atoms";
import { Field } from "@/components/molecules";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { CURRENT_USER, BIND_BGG_USERNAME, IMPORT_COLLECTION } from "@/lib/graphql/documents";

type ThemeChoice = "light" | "dark" | "system";

const THEME_OPTIONS: Segment<ThemeChoice>[] = [
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
	{ value: "system", label: "System" },
];

export function AccountPage() {
	const { user, signOut } = useAuth();
	const { theme, setTheme } = useTheme();
	const [displayName, setDisplayName] = useState("");
	const [email, setEmail] = useState("");
	const [bggUsername, setBggUsername] = useState("");
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const [saveSuccess, setSaveSuccess] = useState(false);

	const { data, loading: queryLoading } = useQuery(CURRENT_USER, {
		fetchPolicy: "cache-and-network",
	});

	const [bindBggUsername] = useMutation(BIND_BGG_USERNAME);
	const [syncCollection, { loading: syncing }] = useMutation(IMPORT_COLLECTION);

	// Populate form from user data
	useEffect(() => {
		const currentUser = data?.currentUser ?? user;
		if (currentUser) {
			setDisplayName(currentUser.displayName || "");
			setEmail(currentUser.email || "");
			setBggUsername(currentUser.bggUsername || currentUser.username || "");
		}
	}, [data, user]);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		setSaveError(null);
		setSaveSuccess(false);

		try {
			// If BGG username changed, bind it
			const currentBgg = data?.currentUser?.bggUsername ?? user?.bggUsername;
			if (bggUsername !== currentBgg) {
				await bindBggUsername({ variables: { username: bggUsername } });
			}
			setSaveSuccess(true);
		} catch (err: any) {
			const message = err?.graphQLErrors?.[0]?.message || err?.message || "Failed to save changes";
			setSaveError(message);
		} finally {
			setSaving(false);
		}
	};

	const handleSync = async () => {
		try {
			await syncCollection({ variables: { username: bggUsername.trim() } });
		} catch {
			// Silently handle — the sync will be retried by the job
		}
	};

	const currentUser = data?.currentUser ?? user;
	const syncStatus = currentUser?.syncStatus;

	return (
		<div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
			<div className="mb-8 flex flex-col gap-2">
				<Eyebrow>Account</Eyebrow>
				<h1 className="text-h1 text-ink">Your profile</h1>
			</div>

			<div className="flex flex-col gap-6">
				{/* Appearance */}
				<Card>
					<CardHeader>
						<CardTitle>Appearance</CardTitle>
						<p className="text-sm text-muted">Choose how the app looks.</p>
					</CardHeader>
					<CardContent className="pt-0">
						<SegmentedControl
							options={THEME_OPTIONS}
							value={theme as ThemeChoice}
							onChange={setTheme}
						/>
					</CardContent>
				</Card>

				<form onSubmit={handleSave} className="flex flex-col gap-6">
					{/* Profile */}
					<Card>
						<CardHeader>
							<CardTitle>Profile</CardTitle>
							<p className="text-sm text-muted">Your name and contact details.</p>
						</CardHeader>
						<CardContent className="flex flex-col gap-4 pt-0">
							{saveError && (
								<p className="text-sm text-bad" role="alert">
									{saveError}
								</p>
							)}
							{saveSuccess && <p className="text-sm text-good">Changes saved successfully.</p>}
							<Field
								label="Display name"
								id="acct-name"
								type="text"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								placeholder="Alex Rivera"
							/>
							<Field
								label="Email"
								id="acct-email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								disabled
								hint="Email cannot be changed at this time."
							/>
						</CardContent>
					</Card>

					{/* BGG collection */}
					<Card>
						<CardHeader>
							<CardTitle>BoardGameGeek</CardTitle>
							<p className="text-sm text-muted">Link your BGG account and sync your collection.</p>
						</CardHeader>
						<CardContent className="flex flex-col gap-4 pt-0">
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center gap-2">
									<Field
										label="Username"
										id="acct-bgg"
										type="text"
										value={bggUsername}
										onChange={(e) => setBggUsername(e.target.value)}
										placeholder="alex123"
										required
										className="flex-1"
									/>
									{syncStatus?.status === "SYNCED" && (
										<Badge tone="good" className="mt-6 shrink-0">
											Synced
										</Badge>
									)}
									{syncStatus?.status === "ERROR" && (
										<Badge tone="bad" className="mt-6 shrink-0">
											Error
										</Badge>
									)}
									{syncStatus?.status === "PENDING" && (
										<Badge tone="warn" className="mt-6 shrink-0">
											Syncing…
										</Badge>
									)}
								</div>
								{syncStatus?.gameCount != null && (
									<p className="text-xs text-muted">
										{syncStatus.gameCount} games imported
										{syncStatus.lastSyncedAt
											? ` · last synced ${new Date(syncStatus.lastSyncedAt).toLocaleDateString()}`
											: ""}
									</p>
								)}
							</div>
							<div className="flex flex-wrap items-center gap-3">
								<Button type="submit" size="lg" disabled={saving || queryLoading}>
									{saving ? "Saving…" : "Save changes"}
								</Button>
								<Button
									type="button"
									variant="outline"
									size="lg"
									onClick={handleSync}
									disabled={syncing || !bggUsername.trim()}
								>
									{syncing ? "Syncing…" : "Sync collection"}
								</Button>
							</div>
						</CardContent>
					</Card>
				</form>

				{/* Session */}
				<Card>
					<CardContent className="flex flex-wrap items-center justify-between gap-4 p-4">
						<div className="flex flex-col gap-0.5">
							<p className="text-sm font-medium text-ink">
								Signed in as {user?.displayName || user?.username}
							</p>
							<p className="text-xs text-muted">{user?.email}</p>
						</div>
						<Button type="button" variant="outline" onClick={() => signOut()}>
							Sign out
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
