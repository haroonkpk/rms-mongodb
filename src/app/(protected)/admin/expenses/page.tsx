import React from 'react'
import { Header } from '@/components/layouts'

export default function AdminExpensesPage() {
  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Expense Management" />
      <main>
        <p className="text-slate-600">Expense Management Content goes here...</p>
      </main>
    </div>
  )
}
