import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface ActiveGroupState {
	/** Group invite token */
	token: string | null;
	/** Group display name */
	name: string | null;
	/** BGG usernames of group members (used for merged collection queries) */
	bggUsernames: string[];
}

interface ActiveGroupContextType extends ActiveGroupState {
	setActiveGroup: (token: string, name: string, bggUsernames: string[]) => void;
	clearActiveGroup: () => void;
}

const ActiveGroupContext = createContext<ActiveGroupContextType | null>(null);

const STORAGE_KEY = "bgg-night-active-group";

function loadInitial(): ActiveGroupState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return JSON.parse(raw);
	} catch {
		/* ignore */
	}
	return { token: null, name: null, bggUsernames: [] };
}

export function ActiveGroupProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<ActiveGroupState>(loadInitial);

	const setActiveGroup = useCallback((token: string, name: string, bggUsernames: string[]) => {
		const next = { token, name, bggUsernames };
		setState(next);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	}, []);

	const clearActiveGroup = useCallback(() => {
		const empty = { token: null, name: null, bggUsernames: [] };
		setState(empty);
		localStorage.removeItem(STORAGE_KEY);
	}, []);

	return (
		<ActiveGroupContext.Provider value={{ ...state, setActiveGroup, clearActiveGroup }}>
			{children}
		</ActiveGroupContext.Provider>
	);
}

export function useActiveGroup() {
	const ctx = useContext(ActiveGroupContext);
	if (!ctx) throw new Error("useActiveGroup must be used within ActiveGroupProvider");
	return ctx;
}
