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
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-white">
          Domov
        </Link>
        <span className="mx-2">/</span>
        <span className="text-white font-medium">{title}</span>
      </nav>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">{title}</h1>
      <div
        className="prose prose-lg max-w-none prose-headings:text-white prose-p:text-gray-400 prose-a:text-[#c9a96e] prose-a:no-underline hover:prose-a:underline static-page-content"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />
    </article>
  )
}
