import { Suspense } from 'react'
import { CollectionBrowser } from '@/components/collection/collection-browser'
import { SkeletonGrid } from '@/components/game-card'

export function CollectionPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-7xl px-4 pt-24 pb-12 sm:px-6">
          <SkeletonGrid count={12} />
        </div>
      }
    >
      <CollectionBrowser />
    </Suspense>
  )
}
