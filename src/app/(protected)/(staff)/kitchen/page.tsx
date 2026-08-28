import React from 'react'
import { Header } from '@/components/layouts'

export default function KitchenPage() {
  return (
    <div className="min-h-screen bg-(--color-page-bg) sm:p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Kitchen Display System (KDS)" />
      <main>
        <p className="text-slate-600">Kitchen Display System Content goes here...</p>
      </main>
    </div>
  )
}
