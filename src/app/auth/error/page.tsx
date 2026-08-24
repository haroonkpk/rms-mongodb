import { Card } from '@/components/ui/card'

export default async function Page({ searchParams }: { searchParams: Promise<{ error: string }> }) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex flex-col space-y-1.5 mb-6">
              <h3 className="font-semibold tracking-tight text-2xl">Sorry, something went wrong.</h3>
            </div>
            <div>
              {params?.error ? (
                <p className="text-sm text-muted-foreground">Code error: {params.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">An unspecified error occurred.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
