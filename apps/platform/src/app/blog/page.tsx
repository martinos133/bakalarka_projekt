'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { CmsGate } from '@/components/CmsGate'
import { api } from '@/lib/api'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('sk-SK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function BlogPageInner() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const data = await api.getBlogPosts()
      setPosts(data)
    } catch (error) {
      console.error('Chyba pri načítaní blogu:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      <Header />
      <CategoryNav />

      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <nav className="mb-6 text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-white">Domov</Link>
          <span className="mx-2">/</span>
          <span className="text-white font-medium">Blog</span>
        </nav>

        <header className="mb-10 overflow-hidden rounded-2xl border border-white/[0.06] bg-card shadow-lg shadow-black/10">
          <div className="relative px-6 py-10 sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -top-24 -right-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
              <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            </div>
            <p className="relative mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
              Blog
            </p>
            <h1 className="relative text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Novinky, návody a tipy z&nbsp;RentMe
            </h1>
            <p className="relative mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
              Čítanie bez balastu. Krátke a praktické články pre inzerentov aj zákazníkov.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="card p-8 text-center text-muted">Načítavam...</div>
        ) : posts.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-muted mb-4">Zatiaľ tu nie sú žiadne príspevky</p>
            <Link href="/" className="text-accent hover:underline">
              Späť na domov
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="group">
                <Link
                  href={`/blog/${post.slug}`}
                  className="block h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-card shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:border-white/[0.1]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-white/[0.03]">
                    {post.featuredImage ? (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="h-10 w-10 rounded-xl border border-white/[0.08] bg-white/[0.04]" />
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-70" />
                    <div className="absolute left-4 top-4 inline-flex items-center rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80 backdrop-blur">
                      Článok
                    </div>
                  </div>

                  <div className="p-5">
                    <h2 className="text-balance text-lg font-semibold leading-snug text-white transition-colors group-hover:text-accent">
                      {post.title}
                    </h2>
                    {post.excerpt ? (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                        {post.excerpt}
                      </p>
                    ) : null}
                    <div className="mt-4 text-xs font-medium text-muted">
                      {formatDate(post.publishedAt || post.createdAt)}
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default function BlogPage() {
  return (
    <CmsGate cmsSlug="blog">
      <BlogPageInner />
    </CmsGate>
  )
}
