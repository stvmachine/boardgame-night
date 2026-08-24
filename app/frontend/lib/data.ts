export type Member = {
	id: string;
	name: string;
	bgg: string;
	color: string;
	online?: boolean;
};

export type Game = {
	id: string;
	title: string;
	cover: string;
	minPlayers: number;
	maxPlayers: number;
	bestAt: number;
	minutes: number;
	weight: number;
	rating: number;
	categories: string[];
	owners: string[];
	addedAt: string;
	description?: string | null;
	lastPlayedAt?: string | null;
};

export type RsvpStatus = "going" | "maybe" | "none" | "no";

export type Rsvp = { memberId: string; status: RsvpStatus };

export type SessionState =
	| "DRAFT"
	| "INVITED"
	| "PICKING"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "CANCELLED";

export type Session = {
	id: string;
	title: string;
	date: string;
	time: string;
	location: string;
	state: SessionState;
	rsvps: Rsvp[];
	gameId?: string;
	winnerId?: string;
};

export type Group = {
	id: string;
	token: string;
	name: string;
	emoji: string;
	description: string;
	memberIds: string[];
	mergedCount: number;
	lastSession: string;
	nextSession?: string;
};

export type Suggestion = {
	gameId: string;
	match: number;
	votes: number;
	confidence: "HIGH" | "MEDIUM" | "LOW" | string;
	reasons: { ok: boolean; label: string }[];
};
