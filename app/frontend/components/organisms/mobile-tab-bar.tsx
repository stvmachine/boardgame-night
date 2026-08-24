import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Users, Plus, CalendarClock, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";

/**
 * MobileTabBar — the phone half of the one nav system (below md). Four
 * destinations plus a single felt-green "+" that always means "create a
 * night". Active reads as ink-weight label + icon; the page bg-page shell
 * respects the safe-area inset.
 */
type Tab = {
	to: string;
	label: string;
	icon: typeof LayoutGrid;
	match: (p: string) => boolean;
};

function TabLink({ tab, pathname }: { tab: Tab; pathname: string }) {
	const active = tab.match(pathname);
	const Icon = tab.icon;
	return (
		<Link
			to={tab.to}
			aria-current={active ? "page" : undefined}
			className={cn(
				"flex h-14 flex-1 flex-col items-center justify-center gap-1",
				active ? "text-ink" : "text-muted",
			)}
		>
			<Icon className={cn("size-[19px]", active && "stroke-[2.25]")} aria-hidden="true" />
			<span className={cn("text-[10px]", active && "font-medium")}>{tab.label}</span>
		</Link>
	);
}

export function MobileTabBar() {
	const { pathname } = useLocation();
	const { token } = useActiveGroup();
	const navigate = useNavigate();

	const shelf = token ? `/collection?group=${encodeURIComponent(token)}` : "/collection";
	const tonight = token ? `/g/${token}` : "/groups";

	const left: Tab[] = [
		{ to: shelf, label: "Shelf", icon: LayoutGrid, match: (p) => p.startsWith("/collection") },
		{ to: "/groups", label: "Groups", icon: Users, match: (p) => p === "/groups" },
	];
	const right: Tab[] = [
		{
			to: tonight,
			label: "Tonight",
			icon: CalendarClock,
			match: (p) => p.startsWith("/g/") || p.startsWith("/s/"),
		},
		{ to: "/account", label: "You", icon: CircleUser, match: (p) => p.startsWith("/account") },
	];

	return (
		<nav
			aria-label="Primary"
			className="fixed inset-x-0 bottom-0 z-40 flex items-center border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
		>
			{left.map((t) => (
				<TabLink key={t.label} tab={t} pathname={pathname} />
			))}
			<div className="flex flex-1 justify-center">
				<button
					type="button"
					aria-label="Create a night"
					onClick={() => navigate(token ? `/g/${token}` : "/groups")}
					className="press flex size-14 items-center justify-center rounded-pill bg-primary text-primary-fg shadow-lift"
				>
					<Plus className="size-6" aria-hidden="true" />
				</button>
			</div>
			{right.map((t) => (
				<TabLink key={t.label} tab={t} pathname={pathname} />
			))}
		</nav>
	);
}
