import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Button, Card, Eyebrow, LinkButton, Skeleton } from "@/components/atoms";
import { AvatarStack, EmptyState, FannedCovers, Field } from "@/components/molecules";
import { MY_GROUPS, CREATE_GROUP } from "@/lib/graphql/documents";
import { toGroup, toMember } from "@/lib/graphql/adapters";

function CreateGroupForm({ onCreated }: { onCreated?: () => void }) {
	const navigate = useNavigate();
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [createGroup, { loading, error: mutationError }] = useMutation(CREATE_GROUP, {
		refetchQueries: [{ query: MY_GROUPS }],
		awaitRefetchQueries: true,
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || loading) return;
		try {
			const { data } = await createGroup({
				variables: { name: name.trim(), description: description.trim() || null },
			});
			const inviteCode = data?.createGroup?.group?.inviteCode;
			if (inviteCode) {
				onCreated?.();
				navigate(`/g/${inviteCode}`);
			}
		} catch {
			// Error surfaced below
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4 text-left">
			{mutationError && (
				<div
					className="rounded-md border border-bad/30 bg-bad-bg px-3 py-2.5 text-sm text-bad"
					role="alert"
				>
					{mutationError.message}
				</div>
			)}
			<Field
				label="Group name"
				id="group-name"
				type="text"
				value={name}
				onChange={(e) => setName(e.target.value)}
				required
			/>
			<Field
				label="Description"
				id="group-description"
				type="text"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
			/>
			<Button type="submit" disabled={loading || !name.trim()} className="w-full">
				{loading ? "Creating…" : "Create group"}
			</Button>
		</form>
	);
}

export function GroupsPage() {
	const { data, loading } = useQuery(MY_GROUPS);

	const groups = useMemo(() => (data?.myGroups ?? []).map(toGroup), [data]);

	// Build member lookup from all group members
	const memberList = useMemo(() => {
		const seen = new Set<string>();
		const result: import("@/lib/data").Member[] = [];
		for (const g of data?.myGroups ?? []) {
			for (const m of g.members) {
				if (!seen.has(m.id)) {
					seen.add(m.id);
					result.push(toMember(m as import("@/lib/graphql/types").GqlUser));
				}
			}
		}
		return result;
	}, [data]);

	if (loading) {
		return (
			<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
				<div className="mb-8 flex flex-col gap-3">
					<Skeleton className="h-4 w-24 rounded-full" />
					<div className="flex items-center justify-between">
						<Skeleton className="h-8 w-32 rounded-lg" />
						<Skeleton className="h-10 w-28 rounded-lg" />
					</div>
				</div>
				<div className="flex flex-col gap-4">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-20 rounded-card" />
					))}
				</div>
			</div>
		);
	}

	if (!data?.myGroups || data.myGroups.length === 0) {
		return (
			<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
				<div className="mb-8 flex flex-col gap-2">
					<Eyebrow>Your groups</Eyebrow>
					<h1 className="text-h1 text-ink">Create a group</h1>
				</div>
				<EmptyState
					layout="center"
					visual={<FannedCovers />}
					title="Start your first group"
					description="Create a group to merge everyone's shelves, plan game nights, and keep score together."
					actions={<CreateGroupForm />}
				/>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
			<div className="mb-8 flex flex-col gap-2">
				<Eyebrow>Your groups</Eyebrow>
				<div className="flex items-center justify-between gap-4">
					<h1 className="text-h1 text-ink">Groups</h1>
					<LinkButton to="/groups" size="lg">
						New group
					</LinkButton>
				</div>
			</div>
			<ul className="flex flex-col gap-4">
				{groups.map((g: import("@/lib/data").Group) => {
					const people = g.memberIds
						.map((id: string) => memberList.find((m) => m.id === id))
						.filter(Boolean)
						.map((m) => ({ id: m!.id, name: m!.name }));
					return (
						<li key={g.id}>
							<Link to={`/g/${g.token}`} className="block rounded-card">
								<Card interactive className="flex items-center gap-5 p-5">
									<span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-inset text-2xl">
										{g.emoji}
									</span>
									<div className="flex min-w-0 flex-1 flex-col gap-1">
										<h2 className="truncate text-base font-semibold text-ink">{g.name}</h2>
										<p className="truncate text-sm text-muted">{g.description}</p>
									</div>
									<div className="hidden shrink-0 flex-col items-end gap-2 sm:flex">
										<AvatarStack people={people} max={4} />
										<span className="numeric text-xs text-faint">{g.mergedCount} games</span>
									</div>
								</Card>
							</Link>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
