import { useCallback, useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, LinkButton, Skeleton } from "@/components/atoms";
import { EmptyState } from "@/components/molecules";
import { GroupHeader } from "@/components/organisms/group-header";
import { UpcomingNights } from "@/components/organisms/upcoming-nights";
import { ShelfSpotlight } from "@/components/organisms/shelf-spotlight";
import { MembersPanel } from "@/components/organisms/members-panel";
import { InvitePanel } from "@/components/organisms/invite-panel";
import { PlaysHistory, ImportPlaysButton } from "@/components/plays-history";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { useCreateNightSessionMutation, useGetGroupQuery } from "@/generated/operations";

export function GroupPage() {
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const { setActiveGroup } = useActiveGroup();
	const [createError, setCreateError] = useState<string | null>(null);
	const { data, loading, error } = useGetGroupQuery({
		variables: { token: token ?? "" },
		skip: !token,
	});
	const group = data?.group ?? null;
	const groupId = group?.id;

	const [createNightSession, { loading: creating }] = useCreateNightSessionMutation({
		update(cache, result) {
			const session = result.data?.createNightSession?.session;
			if (!session || !groupId) return;
			const groupCacheId = cache.identify({ __typename: "Group", id: groupId });
			const sessionCacheId = cache.identify({ __typename: "NightSession", id: session.id });
			if (!groupCacheId || !sessionCacheId) return;

			cache.modify({
				id: groupCacheId,
				fields: {
					sessions(existing = [], { readField }) {
						const references = existing as ReadonlyArray<{ __ref: string }>;
						if (references.some((ref) => readField("id", ref) === session.id)) return references;
						return [...references, { __ref: sessionCacheId }];
					},
				},
			});
		},
	});

	useEffect(() => {
		if (!group) return;
		const memberUsernames = group.members
			.map((member) => member.bggUsername)
			.filter((username): username is string => Boolean(username));
		setActiveGroup(
			group.inviteCode ?? group.id,
			group.name,
			memberUsernames.length > 0 ? memberUsernames : group.anonymousBggUsernames,
		);
	}, [group, setActiveGroup]);

	const canManage = group?.myRole === "OWNER" || group?.myRole === "ADMIN";

	const handleCreateNight = useCallback(async () => {
		if (!group) return;
		setCreateError(null);
		try {
			const result = await createNightSession({
				variables: { groupId: group.id, title: `${group.name} game night` },
			});
			const sessionId = result.data?.createNightSession?.session.id;
			if (sessionId) navigate(`/s/${sessionId}`);
		} catch (mutationError) {
			setCreateError(
				mutationError instanceof Error ? mutationError.message : "Could not create the game night.",
			);
		}
	}, [createNightSession, group, navigate]);

	if (loading) {
		return (
			<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6" aria-busy="true">
				<Skeleton className="mb-8 h-40 rounded-card" />
				<div className="grid gap-8 lg:grid-cols-[1fr_320px]">
					<Skeleton className="h-96 rounded-card" />
					<Skeleton className="h-72 rounded-card" />
				</div>
			</div>
		);
	}

	if (error || !group) {
		return (
			<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
				<EmptyState
					layout="center"
					visual={<CalendarDays className="size-6 text-muted" />}
					title={error ? "Couldn’t load this page" : "Group not found"}
					description={
						error
							? "Please check your connection and try again."
							: "This group doesn’t exist or you don’t have access to it."
					}
					actions={
						<LinkButton to="/groups" variant="outline" size="lg">
							Back to groups
						</LinkButton>
					}
				/>
			</div>
		);
	}

	const importUsername = group.members.find((member) => member.bggUsername)?.bggUsername ?? null;

	return (
		<div data-testid="group-page" className="mx-auto w-full min-w-0 max-w-6xl px-4 py-8 sm:px-6">
			<GroupHeader
				name={group.name}
				description={group.description}
				gamesCount={group.collectionTotalCount}
				membersCount={group.members.length}
				nightsAhead={group.sessions.length}
				canManage={canManage}
				onCreate={handleCreateNight}
				creating={creating}
			/>

			{createError ? (
				<p className="mt-4 text-sm text-bad" role="alert">
					{createError}
				</p>
			) : null}

			<div className="mt-8 grid min-w-0 grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
				<main className="flex min-w-0 flex-col gap-10">
					<UpcomingNights
						group={group}
						canManage={canManage}
						onCreate={handleCreateNight}
						creating={creating}
					/>
					<ShelfSpotlight group={group} />

					<section className="flex flex-col gap-3" aria-labelledby="play-history-heading">
						<h2 id="play-history-heading" className="font-display text-lg font-bold text-ink">
							Play history
						</h2>
						<PlaysHistory
							groupId={group.id}
							headerAction={
								importUsername ? (
									<ImportPlaysButton username={importUsername} groupId={group.id} />
								) : undefined
							}
							emptyActions={
								<>
									{importUsername ? (
										<ImportPlaysButton
											username={importUsername}
											groupId={group.id}
											variant="primary"
											size="default"
											label="Import plays from BGG"
										/>
									) : null}
									<Button variant="outline" onClick={() => navigate("/collection")}>
										Log a play manually
									</Button>
								</>
							}
						/>
					</section>
				</main>

				<aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
					<MembersPanel group={group} />
					{canManage ? <InvitePanel group={group} /> : null}
				</aside>
			</div>
		</div>
	);
}
