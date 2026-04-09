'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { CmsGate } from '@/components/CmsGate'
import { api } from '@/lib/api'

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
    <div className="min-h-screen bg-dark">
      <Header />
      <CategoryNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-white">Domov</Link>
          <span className="mx-2">/</span>
          <span className="text-white font-medium">Blog</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Blog</h1>
        <p className="text-gray-500 mb-12">Články a novinky z našej platformy</p>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Načítavam...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">Zatiaľ tu nie sú žiadne príspevky</p>
            <Link href="/" className="text-accent hover:underline">
              Späť na domov
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {posts.map((post) => (
              <article
                key={post.id}
                className="border-b border-white/[0.08] pb-12 last:border-0 last:pb-0"
              >
                <Link href={`/blog/${post.slug}`} className="block group">
                  {post.featuredImage && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-full h-48 md:h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-white group-hover:text-[#c9a96e] transition-colors mb-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-gray-500 mb-3 line-clamp-2">{post.excerpt}</p>
                  )}
                  <time className="text-sm text-gray-500">
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString('sk-SK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : new Date(post.createdAt).toLocaleDateString('sk-SK', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                  </time>
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
