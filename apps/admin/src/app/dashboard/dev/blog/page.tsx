'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { api } from '@/lib/api'
import RichTextEditor from '@/components/RichTextEditor'
import { Plus, Edit, Trash2, X, Save, BookOpen, ExternalLink, Upload, ImageOff } from 'lucide-react'
import DashboardLayout from '@/components/DashboardLayout'
import Select from '@/components/Select'

interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt?: string
  content: string
  featuredImage?: string
  metaTitle?: string
  metaDescription?: string
  status: string
  publishedAt?: string
  createdAt: string
}

export default function DevBlogPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    metaTitle: '',
    metaDescription: '',
    status: 'DRAFT',
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadPosts()
  }, [router])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const data = await api.getBlogPosts()
      setPosts(data)
    } catch (error) {
      console.error('Chyba pri načítaní príspevkov:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.slug.trim() || !formData.title.trim()) {
      alert('Slug a názov sú povinné')
      return
    }
    try {
      if (editingId) {
        await api.updateBlogPost(editingId, formData)
      } else {
        await api.createBlogPost(formData)
      }
      await loadPosts()
      resetForm()
    } catch (error: any) {
      alert(error?.message || 'Chyba pri ukladaní')
    }
  }

  const handleEdit = (post: BlogPost) => {
    setFormData({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content || '',
      featuredImage: post.featuredImage || '',
      metaTitle: post.metaTitle || '',
      metaDescription: post.metaDescription || '',
      status: post.status || 'DRAFT',
    })
    setEditingId(post.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť tento príspevok?')) return
    try {
      await api.deleteBlogPost(id)
      await loadPosts()
      if (editingId === id) resetForm()
    } catch (error: any) {
      alert(error?.message || 'Chyba pri odstraňovaní')
    }
  }

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      excerpt: '',
      content: '',
      featuredImage: '',
      metaTitle: '',
      metaDescription: '',
      status: 'DRAFT',
    })
    setEditingId(null)
    setShowForm(false)
  }

  const platformUrl = typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3000')
    : ''

  return (
    <DashboardLayout>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Blog</h1>
            <p className="text-gray-400">
              Správa blog príspevkov. Zobrazia sa na platforme na /blog a /blog/{'{slug}'}
            </p>
          </div>

          <div className="mb-6 flex items-center justify-end">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-accent hover:opacity-90 text-dark px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Nový príspevok</span>
              </button>
            )}
          </div>

          {showForm && (
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Upraviť príspevok' : 'Nový príspevok'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Slug (URL) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="napr. prvý-príspevok"
                      className="input px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:border-accent/40 hover:bg-cardHover"
                    />
                    <p className="text-xs text-gray-500 mt-1">URL: /blog/{formData.slug || 'slug'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Názov *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Názov príspevku"
                      className="input px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:border-accent/40 hover:bg-cardHover"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Krátky popis (excerpt)
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    rows={2}
                    placeholder="Krátky popis pre zoznam príspevkov..."
                    className="input px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:border-accent/40 hover:bg-cardHover"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hlavný obrázok
                  </label>
                  {formData.featuredImage ? (
                    <div className="relative group rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.03]">
                      <img
                        src={formData.featuredImage}
                        alt="Náhľad"
                        className="w-full h-52 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="cursor-pointer px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors">
                          Zmeniť
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              if (file.size > 5 * 1024 * 1024) {
                                alert('Obrázok môže mať max. 5 MB')
                                return
                              }
                              const reader = new FileReader()
                              reader.onloadend = () => {
                                setFormData({ ...formData, featuredImage: reader.result as string })
                              }
                              reader.readAsDataURL(file)
                              e.target.value = ''
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, featuredImage: '' })}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm text-red-400 transition-colors"
                        >
                          Odstrániť
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-3 w-full h-44 rounded-xl border-2 border-dashed border-white/[0.1] bg-white/[0.02] hover:border-accent/40 hover:bg-accent/5 cursor-pointer transition-all">
                      <Upload className="w-8 h-8 text-gray-500" />
                      <span className="text-sm text-gray-400">Klikni alebo pretiahni obrázok</span>
                      <span className="text-xs text-gray-600">JPG, PNG, WebP, GIF (max. 5 MB)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 5 * 1024 * 1024) {
                            alert('Obrázok môže mať max. 5 MB')
                            return
                          }
                          const reader = new FileReader()
                          reader.onloadend = () => {
                            setFormData({ ...formData, featuredImage: reader.result as string })
                          }
                          reader.readAsDataURL(file)
                          e.target.value = ''
                        }}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Obsah (formátovanie, obrázky, zoznamy)
                  </label>
                  <RichTextEditor
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    placeholder="Napíšte obsah príspevku. Použite tlačidlo obrázok na vloženie fotky."
                    minHeight={380}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Meta title (SEO)
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      placeholder="SEO názov"
                      className="input px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:border-accent/40 hover:bg-cardHover"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <Select
                      value={formData.status}
                      onChange={(val) => setFormData({ ...formData, status: val })}
                      options={[
                        { value: 'DRAFT', label: 'Koncept' },
                        { value: 'PUBLISHED', label: 'Publikovaný' },
                      ]}
                      />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Meta description (SEO)
                  </label>
                  <textarea
                    value={formData.metaDescription}
                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                    rows={2}
                    placeholder="SEO popis"
                    className="input px-4 py-2 text-white placeholder-white/70 focus:outline-none focus:border-accent/40 hover:bg-cardHover"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-card rounded-xl hover:bg-cardHover transition-colors"
                  >
                    Zrušiť
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-accent hover:opacity-90 text-dark rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Uložiť
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Načítavam...</div>
            ) : posts.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Zatiaľ nemáte žiadne blog príspevky</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="text-accent hover:underline"
                >
                  Vytvoriť prvý príspevok
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Názov</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Slug</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Status</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Dátum</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post) => (
                      <tr key={post.id} className="border-b border-white/[0.06] hover:bg-cardHover hover:bg-opacity-30 transition-colors">
                        <td className="px-4 py-3 font-medium">{post.title}</td>
                        <td className="px-4 py-3">
                          <code className="text-sm text-gray-300">{post.slug}</code>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            post.status === 'PUBLISHED' ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'
                          }`}>
                            {post.status === 'PUBLISHED' ? 'Publikovaný' : 'Koncept'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-sm">
                          {post.publishedAt
                            ? new Date(post.publishedAt).toLocaleDateString('sk-SK')
                            : new Date(post.createdAt).toLocaleDateString('sk-SK')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {post.status === 'PUBLISHED' && platformUrl && (
                              <a
                                href={`${platformUrl}/blog/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                                title="Zobraziť na platforme"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleEdit(post)}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                              title="Upraviť"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              className="p-2 text-red-400 hover:text-red-300 transition-colors"
                              title="Odstrániť"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DashboardLayout>
  )
}
