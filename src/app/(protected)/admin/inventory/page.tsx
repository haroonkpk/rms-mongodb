import React from 'react'
import { Header } from '@/components/layouts'

export default function AdminInventoryPage() {
  return (
    <div className="min-h-screen bg-(--color-page-bg) p-[clamp(1rem,3vw,2.5rem)] pb-24">
      <Header title="Inventory & Stock Management" />
      <main>
        <p className="text-slate-600">Inventory Management Content goes here...</p>
      </main>
    </div>
  )
}
