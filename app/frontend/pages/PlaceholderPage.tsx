import { Eyebrow } from '@/components/primitives'

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-4 pt-28 pb-20 text-center">
      <Eyebrow>Coming soon</Eyebrow>
      <h1 className="text-h1 text-ink">{title}</h1>
      <p className="text-sm text-ink-secondary">
        This page is under construction. Check back soon.
      </p>
    </div>
  )
}
