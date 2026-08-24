import React from 'react'
import { Header } from '@/components/layouts'

export default function AdminEmployeesPage() {
  return (
    <div className="min-h-screen bg-(--color-page-bg) sm:p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Employee & Staff Management" />
      <main>
        <p className="text-slate-600">Employee Management Content goes here...</p>
      </main>
    </div>
  )
}
