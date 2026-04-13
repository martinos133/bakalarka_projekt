'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { CmsArticleView, CmsLoadingView } from '@/components/CmsGate'
import { api } from '@/lib/api'
import { useCmsOverride } from '@/lib/useCmsOverride'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('sk-SK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const blogCmsSlug = slug ? `blog-cms-${slug}` : ''
  const { loading: cmsLoading, page: cmsPage } = useCmsOverride(blogCmsSlug)
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    loadPost()
  }, [slug])

  const loadPost = async () => {
    try {
      setLoading(true)
      setError(false)
      const data = await api.getBlogPost(slug)
      setPost(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (cmsLoading) {
    return <CmsLoadingView shell="withCategoryNav" />
  }
  if (cmsPage && blogCmsSlug) {
    return (
      <CmsArticleView
        shell="withCategoryNav"
        slug={blogCmsSlug}
        title={cmsPage.title}
        content={cmsPage.content}
      />
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <CategoryNav />
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="card p-8 text-center text-muted">Načítavam...</div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-surface">
        <Header />
        <CategoryNav />
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-white mb-4">Príspevok nebol nájdený</h1>
          <Link href="/blog" className="text-accent hover:underline">
            Späť na blog
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <CategoryNav />
      <article lang="sk" className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <nav className="mb-8 text-sm text-zinc-500">
          <Link href="/" className="transition-colors hover:text-zinc-200">Domov</Link>
          <span className="mx-2 text-zinc-600">/</span>
          <Link href="/blog" className="transition-colors hover:text-zinc-200">Blog</Link>
          <span className="mx-2 text-zinc-600">/</span>
          <span className="font-medium text-zinc-300 line-clamp-2">{post.title}</span>
        </nav>

        {post.featuredImage ? (
          <div className="mb-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/40 shadow-xl shadow-black/20">
            <div className="relative aspect-[16/9]">
              <img
                src={post.featuredImage}
                alt={post.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          </div>
        ) : null}

        <header className="mb-10 max-w-prose">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Blog
          </p>
          <h1 className="text-balance break-words text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]">
            {post.title}
          </h1>
          <time
            className="mt-4 block text-sm tabular-nums text-zinc-500"
            dateTime={post.publishedAt || post.createdAt}
          >
            {formatDate(post.publishedAt || post.createdAt)}
          </time>
          {post.excerpt ? (
            <p className="blog-lead mt-6 text-pretty text-lg leading-relaxed text-zinc-400 sm:text-xl">
              {post.excerpt}
            </p>
          ) : null}
        </header>

        <div
          className="blog-content prose prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-zinc-100 prose-headings:tracking-tight prose-headings:text-balance prose-headings:break-words
            prose-h2:text-[1.35rem] prose-h2:mt-12 prose-h2:mb-3 sm:prose-h2:text-[1.5rem]
            prose-h3:text-xl prose-h3:mt-9 prose-h3:mb-3
            prose-p:text-zinc-400 prose-p:leading-[1.85] prose-p:mb-5
            prose-strong:text-zinc-100
            prose-a:text-accent prose-a:no-underline hover:prose-a:underline prose-a:font-semibold
            prose-ul:my-5 prose-ol:my-5 prose-li:my-2 prose-li:text-zinc-400 prose-li:marker:text-zinc-600
            prose-hr:border-white/[0.08]
            prose-blockquote:border-l-accent prose-blockquote:bg-zinc-900/35 prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-zinc-400
            prose-code:text-zinc-200 prose-code:bg-white/[0.07] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-normal
            prose-pre:bg-black/35 prose-pre:border prose-pre:border-white/[0.08]
            prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-8 prose-img:w-full prose-img:max-h-[520px] prose-img:object-contain"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />

        <div className="mt-12 flex items-center justify-between gap-4 border-t border-white/[0.06] pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition-all hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
          >
            Späť na blog
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-muted transition-colors hover:text-white"
          >
            Domov
          </Link>
        </div>
      </article>
      <Footer />
    </div>
  )
}
