'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
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
      <div className="min-h-screen bg-white">
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
      <div className="min-h-screen bg-white">
        <Header />
        <CategoryNav />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Stránka nebola nájdená</h1>
          <Link href="/" className="text-[#1dbf73] hover:underline">
            Späť na domov
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <CategoryNav />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900">Domov</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{page.title}</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
          {page.title}
        </h1>
        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-[#1dbf73] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: page.content || '' }}
        />
      </article>
      <Footer />
    </div>
  )
}
