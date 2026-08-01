import { Routes, Route } from 'react-router-dom'
import { ApolloProvider } from '@apollo/client'
import { apolloClient } from '@/lib/graphql/apollo'
import { SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { MobileTabBar } from '@/components/mobile-tab-bar'
import { LandingPage } from '@/pages/LandingPage'
import { CollectionPage } from '@/pages/CollectionPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { GroupsPage } from '@/pages/GroupsPage'
import { GroupPage } from '@/pages/GroupPage'
import { AccountPage } from '@/pages/AccountPage'
import { SessionPage } from '@/pages/SessionPage'
import { HotGamesPage } from '@/pages/HotGamesPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { GroupSessionsPage } from '@/pages/GroupSessionsPage'
import { AuthProvider } from '@/contexts/AuthContext'
import { ActiveGroupProvider } from '@/contexts/ActiveGroupContext'

export default function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <ActiveGroupProvider>
          <SiteNav />
          <main className="pb-20 md:pb-0">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/collection" element={<CollectionPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/groups" element={<GroupsPage />} />
              <Route path="/g/:token" element={<GroupPage />} />
              <Route path="/g/:token/sessions" element={<GroupSessionsPage />} />
              <Route path="/s/:id" element={<SessionPage />} />
              <Route path="/invite/:token" element={<PlaceholderPage title="Invite" />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/hot" element={<HotGamesPage />} />
              <Route path="*" element={<PlaceholderPage title="Page Not Found" />} />
            </Routes>
          </main>
          <SiteFooter />
          <MobileTabBar />
        </ActiveGroupProvider>
    </AuthProvider>
    </ApolloProvider>
  )
}
