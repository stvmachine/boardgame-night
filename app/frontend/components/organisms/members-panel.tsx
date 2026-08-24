import { useEffect, useRef, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { Button, Card, Eyebrow, IconButton } from "@/components/atoms";
import { MemberRow } from "@/components/molecules";
import { useAuth } from "@/contexts/AuthContext";
import {
	useRemoveGroupMemberMutation,
	useUpdateGroupMemberRoleMutation,
	type GetGroupQuery,
} from "@/generated/operations";

type Group = NonNullable<GetGroupQuery["group"]>;
type GroupMember = Group["members"][number];
type GroupMembership = Group["memberships"][number];

/**
 * MembersPanel — the "Members · N" sidebar card. Each member reads as a
 * MemberRow (colour disc + name + @handle) with a trailing OWNER/MEMBER tag;
 * owners/admins get an inline actions menu (change role, remove).
 */
export function MembersPanel({ group }: { group: Group }) {
	const { user } = useAuth();
	const [openActionsFor, setOpenActionsFor] = useState<string | null>(null);
	const [confirmingMembershipId, setConfirmingMembershipId] = useState<string | null>(null);
	const [mutationError, setMutationError] = useState<string | null>(null);
	const cancelButtonRef = useRef<HTMLButtonElement>(null);
	const groupCacheKey = group.id;
	const canManage = group.myRole === "OWNER" || group.myRole === "ADMIN";

	const [removeGroupMember, { loading: removing }] = useRemoveGroupMemberMutation({
		update(cache, result) {
			const removedMembershipId = result.data?.removeGroupMember?.removedMembershipId;
			if (!removedMembershipId) return;
			const groupCacheId = cache.identify({ __typename: "Group", id: groupCacheKey });
			if (!groupCacheId) return;
			cache.modify({
				id: groupCacheId,
				fields: {
					memberships(existing = [], { readField }) {
						const references = existing as ReadonlyArray<{ __ref: string }>;
						return references.filter(
							(reference) => readField("id", reference) !== removedMembershipId,
						);
					},
				},
			});
		},
	});
	const [updateGroupMemberRole, { loading: updatingRole }] = useUpdateGroupMemberRoleMutation();

	useEffect(() => {
		if (confirmingMembershipId) cancelButtonRef.current?.focus();
	}, [confirmingMembershipId]);

	const membershipByUserId = new Map(
		group.memberships.map((membership) => [membership.user.id, membership]),
	);

	const canActOn = (membership: GroupMembership) => {
		if (membership.role === "OWNER" || membership.user.id === user?.id) return false;
		return group.myRole === "OWNER" || group.myRole === "ADMIN";
	};

	const handleRoleChange = async (member: GroupMember, membership: GroupMembership) => {
		const role = membership.role === "ADMIN" ? "MEMBER" : "ADMIN";
		setMutationError(null);
		try {
			await updateGroupMemberRole({
				variables: { groupId: group.id, userId: member.id, role },
			});
			setOpenActionsFor(null);
		} catch (error) {
			setMutationError(error instanceof Error ? error.message : "Could not change this role.");
		}
	};

	const handleRemove = async (member: GroupMember) => {
		setMutationError(null);
		try {
			await removeGroupMember({ variables: { groupId: group.id, userId: member.id } });
			setConfirmingMembershipId(null);
			setOpenActionsFor(null);
		} catch (error) {
			setMutationError(error instanceof Error ? error.message : "Could not remove this member.");
		}
	};

	return (
		<Card className="flex flex-col gap-3 p-4">
			<div className="flex items-center justify-between">
				<Eyebrow>Members · {group.members.length}</Eyebrow>
				{canManage ? (
					<span className="numeric text-[11px] font-medium text-primary">manage</span>
				) : null}
			</div>

			<ul className="flex flex-col gap-3">
				{group.members.map((member) => {
					const membership = membershipByUserId.get(member.id);
					if (!membership) return null;
					const actionsAvailable = canActOn(membership);
					const actionsOpen = openActionsFor === membership.id;
					const confirming = confirmingMembershipId === membership.id;

					return (
						<li key={member.id}>
							<MemberRow
								name={member.displayName}
								sub={member.bggUsername ? `@${member.bggUsername}` : undefined}
								seed={member.id}
								trailing={
									<div className="flex items-center gap-1.5">
										<span className="numeric text-[10px] tracking-[0.08em] text-muted uppercase">
											{membership.role}
										</span>
										{actionsAvailable ? (
											<IconButton
												aria-label={`Actions for ${member.displayName}`}
												aria-expanded={actionsOpen}
												onClick={() => {
													setMutationError(null);
													setOpenActionsFor(actionsOpen ? null : membership.id);
													setConfirmingMembershipId(null);
												}}
											>
												<EllipsisVertical aria-hidden="true" />
											</IconButton>
										) : null}
									</div>
								}
							/>

							{actionsOpen && !confirming ? (
								<div className="mt-2 flex flex-wrap justify-end gap-2 border-t border-line pt-2">
									{group.myRole === "OWNER" ? (
										<Button
											variant="outline"
											size="sm"
											disabled={updatingRole}
											onClick={() => handleRoleChange(member, membership)}
										>
											{membership.role === "ADMIN" ? "Change role to member" : "Make admin"}
										</Button>
									) : null}
									<Button
										variant="destructive"
										size="sm"
										onClick={() => {
											setMutationError(null);
											setConfirmingMembershipId(membership.id);
										}}
									>
										Remove
									</Button>
								</div>
							) : null}

							{confirming ? (
								<div className="mt-2 rounded-md border border-bad/40 bg-bad-bg p-3" role="alert">
									<p className="text-sm text-ink">
										<strong>Remove {member.displayName}?</strong> They will be removed from the
										group and their games will no longer appear in the shared collection.
									</p>
									{mutationError ? <p className="mt-2 text-sm text-bad">{mutationError}</p> : null}
									<div className="mt-3 flex justify-end gap-2">
										<Button
											ref={cancelButtonRef}
											variant="outline"
											size="sm"
											onClick={() => {
												setConfirmingMembershipId(null);
												setMutationError(null);
											}}
										>
											Cancel
										</Button>
										<Button
											variant="destructive"
											size="sm"
											disabled={removing}
											onClick={() => handleRemove(member)}
										>
											Remove
										</Button>
									</div>
								</div>
							) : null}
						</li>
					);
				})}
			</ul>

			{mutationError && !confirmingMembershipId ? (
				<p className="text-sm text-bad" role="alert">
					{mutationError}
				</p>
			) : null}
		</Card>
	);
}
