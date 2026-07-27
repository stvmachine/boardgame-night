import { Eyebrow, Card } from '@/components/primitives'
import { LinkButton } from '@/components/ui/link-button'

export function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-24 pb-20 sm:px-6">
      <div className="mb-8 flex flex-col gap-3">
        <Eyebrow>Account</Eyebrow>
        <h1 className="text-h1 text-ink">Your profile</h1>
      </div>

      <Card className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="acct-name" className="text-sm font-medium text-ink">Name</label>
          <input
            id="acct-name"
            type="text"
            defaultValue="Alex Rivera"
            className="rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="acct-email" className="text-sm font-medium text-ink">Email</label>
          <input
            id="acct-email"
            type="email"
            defaultValue="alex@example.com"
            className="rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="acct-bgg" className="text-sm font-medium text-ink">BoardGameGeek username</label>
          <div className="flex items-center gap-2">
            <input
              id="acct-bgg"
              type="text"
              defaultValue="alex123"
              className="flex-1 rounded-lg border border-line bg-surface-raised px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
            />
            <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-semibold text-success">
              Verified
            </span>
          </div>
        </div>
        <LinkButton to="/account" size="lg" className="self-start">
          Save changes
        </LinkButton>
      </Card>
    </div>
  )
}
