'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import CategoryNav from '@/components/CategoryNav'
import Footer from '@/components/Footer'
import { CmsArticleView, CmsLoadingView } from '@/components/CmsGate'
import { api } from '@/lib/api'
import { useCmsOverride } from '@/lib/useCmsOverride'

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

  if (error || !post) {
    return (
      <div className="min-h-screen bg-dark">
        <Header />
        <CategoryNav />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
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
    <div className="min-h-screen bg-dark">
      <Header />
      <CategoryNav />
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <nav className="mb-6 text-sm text-gray-500">
          <Link href="/" className="hover:text-white">Domov</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-white">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-white font-medium">{post.title}</span>
        </nav>

        {post.featuredImage && (
          <div className="mb-8 rounded-xl overflow-hidden shadow-lg shadow-black/20">
            <img
              src={post.featuredImage}
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {post.title}
          </h1>
          <time className="text-gray-500">
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
        </header>

        <div
          className="blog-content prose prose-lg max-w-none
            prose-headings:font-bold prose-headings:text-white prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-gray-400 prose-p:leading-relaxed prose-p:mb-4
            prose-a:text-[#c9a96e] prose-a:no-underline hover:prose-a:underline prose-a:font-medium
            prose-ul:my-4 prose-ol:my-4 prose-li:my-1
            prose-blockquote:border-l-[#c9a96e] prose-blockquote:bg-dark-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-gray-300
            prose-img:rounded-xl prose-img:shadow-md prose-img:my-6 prose-img:w-full prose-img:max-h-[500px] prose-img:object-contain"
          dangerouslySetInnerHTML={{ __html: post.content || '' }}
        />
      </article>
      <Footer />
    </div>
  )
}
