'use client'

import { useRouter } from 'next/navigation'

import { logout as serverLogout } from '@/actions/auth'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
  const router = useRouter()

  const logout = async () => {
    await serverLogout()
    router.push('/auth/login')
  }

  return <Button onClick={logout}>Logout</Button>
}
