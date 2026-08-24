import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveGroup } from "@/contexts/ActiveGroupContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Logo } from "@/components/atoms/logo";
import { LinkButton } from "@/components/atoms/link-button";
import { IconButton } from "@/components/atoms/icon-button";
import { Avatar } from "@/components/atoms/avatar";

/**
 * TopNav — the desktop chrome. One nav system across the app: logo, primary
 * destinations as filled-slab active states, a paper theme toggle, and either
 * the account chip (app) or Log in / Start free (public). Below md the primary
 * links defer to the MobileTabBar, so only logo · theme · account remain.
 */
function ThemeButton() {
	const { resolved, setTheme } = useTheme();
	return (
		<IconButton
			aria-label={resolved === "light" ? "Switch to dark theme" : "Switch to light theme"}
			onClick={() => setTheme(resolved === "light" ? "dark" : "light")}
		>
			{resolved === "light" ? <Moon /> : <Sun />}
		</IconButton>
	);
}

function NavLink({
	to,
	active,
	children,
}: {
	to: string;
	active: boolean;
	children: React.ReactNode;
}) {
	return (
		<Link
			to={to}
			aria-current={active ? "page" : undefined}
			className={cn(
				"rounded-md px-3 py-1.5 text-base transition-colors",
				active ? "bg-inset font-medium text-ink" : "text-ink-2 hover:bg-inset/60",
			)}
		>
			{children}
		</Link>
	);
}

function AccountMenu() {
	const { user, signOut } = useAuth();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const onClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("mousedown", onClick);
		return () => document.removeEventListener("mousedown", onClick);
	}, [open]);

	if (!user) return null;
	const name = user.displayName || user.username;

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-haspopup="menu"
				aria-expanded={open}
				className="press flex items-center gap-2 rounded-pill border border-line bg-surface py-1 pr-3 pl-1"
			>
				<Avatar name={name} seed={user.id} size="sm" />
				<span className="hidden text-[13px] text-ink-2 sm:inline">{name}</span>
			</button>
			{open && (
				<div
					role="menu"
					className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-md border border-line bg-surface p-1 shadow-shell"
				>
					<Link
						to="/account"
						role="menuitem"
						onClick={() => setOpen(false)}
						className="block rounded-[6px] px-3 py-2 text-sm text-ink-2 hover:bg-inset hover:text-ink"
					>
						Account
					</Link>
					<button
						type="button"
						role="menuitem"
						onClick={async () => {
							setOpen(false);
							await signOut();
							navigate("/");
						}}
						className="block w-full rounded-[6px] px-3 py-2 text-left text-sm text-ink-2 hover:bg-inset hover:text-ink"
					>
						Log out
					</button>
				</div>
			)}
		</div>
	);
}

export function TopNav({ variant = "app" }: { variant?: "app" | "public" }) {
	const { pathname } = useLocation();
	const { user } = useAuth();
	const { token } = useActiveGroup();

	const appLinks = [
		{ to: "/collection", label: "Collection", match: (p: string) => p.startsWith("/collection") },
		{ to: "/groups", label: "Groups", match: (p: string) => p === "/groups" },
		{
			to: token ? `/g/${token}` : "/groups",
			label: "Sessions",
			match: (p: string) => p.startsWith("/g/") || p.startsWith("/s/"),
		},
		{ to: "/account", label: "Account", match: (p: string) => p.startsWith("/account") },
	];

	return (
		<header className="sticky top-0 z-40 border-b border-line bg-surface-2/90 backdrop-blur-md">
			<nav
				aria-label="Main"
				className="mx-auto flex h-15 w-full max-w-6xl items-center gap-7 px-4 sm:px-6"
			>
				<Logo />

				{variant === "app" ? (
					<div className="hidden items-center gap-0.5 md:flex">
						{appLinks.map((l) => (
							<NavLink key={l.label} to={l.to} active={l.match(pathname)}>
								{l.label}
							</NavLink>
						))}
					</div>
				) : (
					<div className="hidden items-center gap-0.5 md:flex">
						<a
							href="/#tour"
							className="rounded-md px-3 py-1.5 text-base text-ink-2 hover:bg-inset/60"
						>
							How it works
						</a>
						<a
							href="/#trending"
							className="rounded-md px-3 py-1.5 text-base text-ink-2 hover:bg-inset/60"
						>
							Trending
						</a>
					</div>
				)}

				<div className="ml-auto flex items-center gap-2.5">
					<ThemeButton />
					{variant === "app" && user ? (
						<AccountMenu />
					) : (
						<>
							<Link to="/login" className="px-1.5 text-base text-ink-2 hover:text-ink">
								Log in
							</Link>
							<LinkButton to="/signup" size="sm" variant="ink">
								Start free
							</LinkButton>
						</>
					)}
				</div>
			</nav>
		</header>
	);
}
