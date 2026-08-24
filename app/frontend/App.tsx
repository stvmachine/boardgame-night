import { Routes, Route } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/graphql/apollo";
import { AppShell } from "@/components/templates/app-shell";
import { PublicShell } from "@/components/templates/public-shell";
import { AuthShell } from "@/components/templates/auth-shell";
import { LandingPage } from "@/pages/LandingPage";
import { CollectionPage } from "@/pages/CollectionPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/pages/ResetPasswordPage";
import { VerifyEmailPage } from "@/pages/VerifyEmailPage";
import { AccountSessionsPage } from "@/pages/AccountSessionsPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { GroupsPage } from "@/pages/GroupsPage";
import { GroupPage } from "@/pages/GroupPage";
import { AccountPage } from "@/pages/AccountPage";
import { SessionPage } from "@/pages/SessionPage";
import { HotGamesPage } from "@/pages/HotGamesPage";
import { HealthPage } from "@/pages/HealthPage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { GroupSessionsPage } from "@/pages/GroupSessionsPage";
import { InvitePage } from "@/pages/InvitePage";
import { AuthProvider } from "@/contexts/AuthContext";
import { ActiveGroupProvider } from "@/contexts/ActiveGroupContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function App() {
	return (
		<ThemeProvider>
			<ApolloProvider client={apolloClient}>
				<AuthProvider>
					<ActiveGroupProvider>
						<Routes>
							{/* Public marketing shell (full footer) */}
							<Route element={<PublicShell />}>
								<Route path="/" element={<LandingPage />} />
							</Route>

							{/* Centered auth shell */}
							<Route element={<AuthShell />}>
								<Route path="/login" element={<LoginPage />} />
								<Route path="/signup" element={<SignupPage />} />
								<Route path="/forgot-password" element={<ForgotPasswordPage />} />
								<Route path="/reset-password" element={<ResetPasswordPage />} />
								<Route path="/verify-email" element={<VerifyEmailPage />} />
							</Route>

							{/* Authenticated app shell (top nav + tab bar + quiet footer) */}
							<Route element={<AppShell />}>
								<Route path="/collection" element={<CollectionPage />} />
								<Route path="/groups" element={<GroupsPage />} />
								<Route path="/g/:token" element={<GroupPage />} />
								<Route path="/g/:token/sessions" element={<GroupSessionsPage />} />
								<Route path="/s/:id" element={<SessionPage />} />
								<Route path="/invite/:token" element={<InvitePage />} />
								<Route path="/account" element={<AccountPage />} />
								<Route
									path="/account/sessions"
									element={
										<ProtectedRoute>
											<AccountSessionsPage />
										</ProtectedRoute>
									}
								/>
								<Route path="/hot" element={<HotGamesPage />} />
								<Route path="/health" element={<HealthPage />} />
								<Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
							</Route>
						</Routes>
					</ActiveGroupProvider>
				</AuthProvider>
			</ApolloProvider>
		</ThemeProvider>
	);
}
