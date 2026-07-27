import { Suspense } from 'react'
import { CollectionBrowser } from '@/components/collection/collection-browser'
import { SkeletonGrid } from '@/components/game-card'
import { MobileTabBar } from '@/components/mobile-tab-bar'
import { SiteNav } from '@/components/site-nav'

export const metadata = {
  title: 'Collection — BoardGameNight',
  description: "Browse your group's merged board game collection with faceted filters.",
}

export default function CollectionPage() {
  return (
    <>
      <SiteNav />
      <main>
        <Suspense
          fallback={
            <div className="mx-auto w-full max-w-7xl px-4 pt-24 pb-12 sm:px-6">
              <SkeletonGrid count={12} />
            </div>
          }
        >
          <CollectionBrowser />
        </Suspense>
      </main>
      <MobileTabBar />
    </>
  )
}
