'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export function ForgotPasswordForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const success = false
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Direct redirect to update password page for testing purposes (since there's no real email server)
      router.push(`/auth/update-password?email=${encodeURIComponent(email)}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {success ? (
        <Card>
          <div className="flex flex-col space-y-1.5 mb-6">
            <h3 className="font-semibold tracking-tight text-2xl">Check Your Email</h3>
            <p className="text-sm text-muted-foreground">Password reset instructions sent</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              If you registered using your email and password, you will receive a password reset
              email.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col space-y-1.5 mb-6">
            <h3 className="font-semibold tracking-tight text-2xl">Reset Your Password</h3>
            <p className="text-sm text-muted-foreground">
              Type in your email and we&apos;ll send you a link to reset your password
            </p>
          </div>
          <div>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send reset email'}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/auth/login" className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            </form>
          </div>
        </Card>
      )}
    </div>
  )
}
