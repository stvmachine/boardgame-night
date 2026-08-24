import { Outlet } from "react-router-dom";
import { TopNav } from "@/components/organisms/top-nav";
import { MobileTabBar } from "@/components/organisms/mobile-tab-bar";
import { AppFooter } from "@/components/organisms/app-footer";

/**
 * AppShell — the authenticated layout: sticky TopNav, the routed screen, a
 * quiet one-line footer, and the phone tab bar. Extra bottom padding below md
 * keeps content clear of the fixed tab bar.
 */
export function AppShell() {
	return (
		<div className="flex min-h-dvh flex-col bg-page">
			<TopNav variant="app" />
			<main className="flex-1 pb-24 md:pb-0">
				<Outlet />
			</main>
			<AppFooter />
			<MobileTabBar />
		</div>
	);
}
