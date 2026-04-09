'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'

type Props = {
  slug: string
  title: string
  content: string
}

export function StaticPageArticle({ slug, title, content }: Props) {
  const { bodyHtml, pageCss } = useMemo(() => {
    const raw = content || ''
    const m = raw.match(/^<style[^>]*>([\s\S]*?)<\/style>\s*/i)
    if (!m) return { bodyHtml: raw, pageCss: '' }
    return { pageCss: m[1].trim(), bodyHtml: raw.slice(m[0].length).trim() }
  }, [content])

  useEffect(() => {
    if (!pageCss) return
    const el = document.createElement('style')
    el.setAttribute('data-rentme-static-page', slug)
    el.textContent = pageCss
    document.head.appendChild(el)
    return () => {
      el.remove()
    }
  }, [pageCss, slug])

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="mb-6 text-sm text-gray-600">
        <Link href="/" className="hover:text-gray-900">
          Domov
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">{title}</span>
      </nav>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">{title}</h1>
      <div
        className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-[#1dbf73] prose-a:no-underline hover:prose-a:underline static-page-content"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </article>
  )
}
