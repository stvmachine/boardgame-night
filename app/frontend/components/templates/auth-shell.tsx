import { Outlet } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Logo } from "@/components/atoms/logo";
import { IconButton } from "@/components/atoms/icon-button";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * AuthShell — a quiet, centered frame for login / signup. Just the logo and a
 * theme toggle up top; the form owns the middle of the page.
 */
export function AuthShell() {
	const { resolved, setTheme } = useTheme();
	return (
		<div className="flex min-h-dvh flex-col bg-page">
			<header className="mx-auto flex h-15 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
				<Logo />
				<IconButton
					aria-label={resolved === "light" ? "Switch to dark theme" : "Switch to light theme"}
					onClick={() => setTheme(resolved === "light" ? "dark" : "light")}
				>
					{resolved === "light" ? <Moon /> : <Sun />}
				</IconButton>
			</header>
			<main className="flex flex-1 items-center justify-center px-4 py-10">
				<Outlet />
			</main>
		</div>
	);
}
