import { Outlet } from "react-router-dom";
import { TopNav } from "@/components/organisms/top-nav";
import { MarketingFooter } from "@/components/organisms/marketing-footer";

/**
 * PublicShell — the logged-out marketing layout: public TopNav + routed page +
 * full marketing footer.
 */
export function PublicShell() {
	return (
		<div className="flex min-h-dvh flex-col bg-page">
			<TopNav variant="public" />
			<main className="flex-1">
				<Outlet />
			</main>
			<MarketingFooter />
		</div>
	);
}
