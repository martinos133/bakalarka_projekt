'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { StaticPageArticle } from '@/components/StaticPageArticle'
import { api } from '@/lib/api'

const RESERVED_PATHS = ['inzerat', 'kategoria', 'dashboard', 'vyhladavanie', 'signin', 'join', 'api', 'blog']

export default function StaticPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [page, setPage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (RESERVED_PATHS.includes(slug)) {
      setError(true)
      setLoading(false)
      return
    }
    loadPage()
  }, [slug])

  const loadPage = async () => {
    try {
      setLoading(true)
      setError(false)
      const data = await api.getStaticPage(slug)
      setPage(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark">
        <Header />
        <CategoryNav />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-gray-500">Načítavam...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-dark">
        <Header />
        <CategoryNav />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Stránka nebola nájdená</h1>
          <Link href="/" className="text-accent hover:underline">
            Späť na domov
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark">
      <Header />
      <CategoryNav />
      <StaticPageArticle slug={slug} title={page.title} content={page.content || ''} />
      <Footer />
    </div>
  )
}
