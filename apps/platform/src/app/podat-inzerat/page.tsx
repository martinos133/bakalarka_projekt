'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { CmsGate } from '@/components/CmsGate'
import CreateAdvertisementWizard from '@/components/CreateAdvertisementWizard'
import { api } from '@/lib/api'
import { isAuthenticated } from '@/lib/auth'
import Link from 'next/link'

function PodatInzeratContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const kategoriaSlug = searchParams.get('kategoria')
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated()) {
      const dest =
        '/podat-inzerat' +
        (kategoriaSlug ? `?kategoria=${encodeURIComponent(kategoriaSlug)}` : '')
      router.replace(`/signin?redirect=${encodeURIComponent(dest)}`)
      return
    }
    let cancelled = false
    api
      .getCategories()
      .then((data) => {
        if (!cancelled) setCategories(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) setCategories([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [router, kategoriaSlug])

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted">Načítavam kategórie…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav className="mb-6 text-sm text-muted" aria-label="Drobečková navigácia">
        <Link href="/" className="transition-colors hover:text-accent-light">
          Domov
        </Link>
        <span className="mx-2 text-white/25">/</span>
        <span className="font-medium text-white">Pridať inzerát</span>
      </nav>
      <CreateAdvertisementWizard
        categories={categories}
        variant="embed"
        initialCategorySlug={kategoriaSlug}
        onComplete={() => {
          router.push('/dashboard?tab=advertisements')
        }}
      />
    </div>
  )
}

export default function PodatInzeratPage() {
  return (
    <CmsGate cmsSlug="podat-inzerat" shell="headerFooterOnly">
    <div className="min-h-screen bg-dark-50">
      <Header />
      <Suspense
        fallback={
          <div className="flex min-h-[50vh] items-center justify-center text-muted">Načítavam…</div>
        }
      >
        <PodatInzeratContent />
      </Suspense>
      <Footer />
    </div>
    </CmsGate>
  )
}
