'use client'

import DashboardLayout from '@/components/DashboardLayout'
import { Boxes, Palette, LayoutTemplate } from 'lucide-react'

export default function DevComponentsPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Development - Komponenty
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
            Správa a úprava UI komponentov platformy. Táto sekcia bude slúžiť na katalóg, verzie a
            náhľady zdieľaných komponentov v súlade so zvyškom admin rozhrania.
          </p>
        </header>

        <div className="card border border-white/[0.06] bg-card p-6 shadow-lg shadow-black/20 sm:p-8">
          <div className="rounded-2xl border border-dashed border-white/[0.08] bg-dark/40 px-6 py-14 text-center sm:px-10 sm:py-16">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 ring-1 ring-accent/20">
              <Boxes className="h-7 w-7 text-accent" aria-hidden />
            </div>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
              Funkcionalita pre správu komponentov bude pridaná…
            </p>
            <div className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
                <Palette className="h-3.5 w-3.5 text-accent/80" aria-hidden />
                Farebné tokeny adminu
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5">
                <LayoutTemplate className="h-3.5 w-3.5 text-accent/80" aria-hidden />
                Rozloženie ako na nástenke
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
