'use client'

import type { ReactNode } from 'react'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { StaticPageArticle } from '@/components/StaticPageArticle'
import { useCmsOverride } from '@/lib/useCmsOverride'

export type CmsGateShell = 'withCategoryNav' | 'headerFooterOnly'

export function CmsLoadingView({ shell }: { shell: CmsGateShell }) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      {shell === 'withCategoryNav' ? <CategoryNav /> : null}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-gray-500">
        Načítavam…
      </div>
      <Footer />
    </div>
  )
}

export function CmsArticleView({
  shell,
  slug,
  title,
  content,
}: {
  shell: CmsGateShell
  slug: string
  title: string
  content: string
}) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      {shell === 'withCategoryNav' ? <CategoryNav /> : null}
      <StaticPageArticle slug={slug} title={title} content={content} />
      <Footer />
    </div>
  )
}

export function CmsGate({
  cmsSlug,
  shell = 'withCategoryNav',
  children,
}: {
  cmsSlug: string
  shell?: CmsGateShell
  children: ReactNode
}) {
  const { loading, page } = useCmsOverride(cmsSlug)

  if (loading) return <CmsLoadingView shell={shell} />
  if (page) return <CmsArticleView shell={shell} slug={cmsSlug} title={page.title} content={page.content} />
  return <>{children}</>
}
