'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ImageOff } from 'lucide-react'
import { api } from '@/lib/api'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  featuredImage: string | null
  publishedAt: string | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('sk-SK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function MadeOnRentMe() {
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    api
      .getBlogPosts(4)
      .then((data: BlogPost[]) => {
        setPosts(Array.isArray(data) ? data : [])
      })
      .catch(() => {})
  }, [])

  if (posts.length === 0) return null

  return (
    <section className="py-16 bg-dark-50 border-t border-white/[0.04]">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-accent text-sm font-semibold uppercase tracking-[0.2em] mb-3">Blog</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Najnovšie <span className="font-serif italic">články</span>
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group cursor-pointer overflow-hidden rounded-lg"
            >
              <div className="relative overflow-hidden rounded-lg bg-white/[0.04]">
                {post.featuredImage ? (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-64 flex items-center justify-center">
                    <ImageOff className="h-10 w-10 text-muted" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-accent transition-colors line-clamp-2">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                )}
                {post.publishedAt && (
                  <p className="text-xs text-muted mt-2">{formatDate(post.publishedAt)}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
        {posts.length >= 4 && (
          <div className="text-center mt-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-3 text-sm font-medium text-white transition-all hover:border-accent/40 hover:bg-accent/10 hover:text-accent"
            >
              Zobraziť všetky články
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
