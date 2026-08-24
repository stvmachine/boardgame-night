import { cn } from "@/lib/utils";

/**
 * Avatar — an initials token. Board-game night is social, so members read as
 * warm colour discs (felt-green, amber, slate-blue, clay-red). Colour is
 * chosen deterministically from a seed and rendered as Tailwind classes — no
 * inline styles — so a given member is always the same colour.
 */
export const avatarTones = {
	primary: "bg-primary text-primary-fg",
	accent: "bg-accent text-ink",
	info: "bg-info text-primary-fg",
	clay: "bg-bad text-primary-fg",
	ink: "bg-ink text-surface-2",
} as const;

export type AvatarTone = keyof typeof avatarTones;

const toneCycle: AvatarTone[] = ["primary", "accent", "info", "clay"];

const sizes = {
	xs: "size-5 text-[9px]",
	sm: "size-6 text-[10px]",
	md: "size-8 text-[11px]",
	lg: "size-10 text-xs",
	xl: "size-12 text-sm",
} as const;

export type AvatarSize = keyof typeof sizes;

/** Deterministic tone from any stable seed (member id / username). */
export function toneForSeed(seed: string): AvatarTone {
	let hash = 0;
	for (let i = 0; i < seed.length; i += 1) {
		hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
	}
	return toneCycle[hash % toneCycle.length];
}

export function initialsOf(name: string): string {
	return name
		.replace(/[^a-zA-Z0-9 ]/g, "")
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function Avatar({
	name,
	tone,
	seed,
	size = "md",
	ring = false,
	className,
}: {
	name: string;
	tone?: AvatarTone;
	seed?: string;
	size?: AvatarSize;
	ring?: boolean;
	className?: string;
}) {
	const resolved = tone ?? toneForSeed(seed ?? name);
	return (
		<span
			data-slot="avatar"
			aria-hidden="true"
			title={name}
			className={cn(
				"numeric inline-flex shrink-0 items-center justify-center rounded-pill font-bold",
				sizes[size],
				avatarTones[resolved],
				ring && "ring-2 ring-surface",
				className,
			)}
		>
			{initialsOf(name)}
		</span>
	);
}
