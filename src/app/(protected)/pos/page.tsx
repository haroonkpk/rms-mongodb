import React from 'react'
import { LogoutButton } from '@/components/logout-button'

function page() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">POS Dashboard</h1>
        <LogoutButton />
      </header>
      <main className="p-4 flex-1">
        <p className="text-slate-600">Welcome to the POS Page</p>
      </main>
    </div>
  )
}

export default page