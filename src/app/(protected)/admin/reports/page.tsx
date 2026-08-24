import React from 'react'
import { Header } from '@/components/layouts'

export default function AdminReportsPage() {
  return (
    <div className="min-h-screen bg-(--color-page-bg) sm:p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Reports & Analytics" />
      <main>
        <p className="text-slate-600">Reports & Analytics Content goes here...</p>
      </main>
    </div>
  )
}
