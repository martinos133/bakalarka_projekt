'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { Plus, Edit, Trash2, X, Save, FileCode, ExternalLink } from 'lucide-react'

interface StaticPage {
  id: string
  slug: string
  title: string
  content: string
  metaTitle?: string
  metaDescription?: string
  status: string
  order: number
}

export default function DevStaticPagesPage() {
  const router = useRouter()
  const [pages, setPages] = useState<StaticPage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    content: '',
    metaTitle: '',
    metaDescription: '',
    status: 'DRAFT',
    order: 0,
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadPages()
  }, [router])

  const loadPages = async () => {
    try {
      setLoading(true)
      setLoadError(null)
      const data = await api.getStaticPages()
      // API môže vrátiť pole priamo alebo objekt s pages/items
      const list = Array.isArray(data)
        ? data
        : (data?.pages ?? data?.items ?? [])
      setPages(Array.isArray(list) ? list : [])
    } catch (error: any) {
      console.error('Chyba pri načítaní stránok:', error)
      setLoadError(error?.message || 'Nepodarilo sa načítať zoznam. Skontrolujte prihlásenie a obnovte stránku.')
      setPages([])
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
        await api.updateStaticPage(editingId, formData)
      } else {
        await api.createStaticPage(formData)
      }
      await loadPages()
      resetForm()
    } catch (error: any) {
      alert(error?.message || 'Chyba pri ukladaní')
    }
  }

  const handleEdit = (page: StaticPage) => {
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content || '',
      metaTitle: page.metaTitle || '',
      metaDescription: page.metaDescription || '',
      status: page.status || 'DRAFT',
      order: page.order ?? 0,
    })
    setEditingId(page.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť túto stránku?')) return
    try {
      await api.deleteStaticPage(id)
      await loadPages()
      if (editingId === id) resetForm()
    } catch (error: any) {
      alert(error?.message || 'Chyba pri odstraňovaní')
    }
  }

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      content: '',
      metaTitle: '',
      metaDescription: '',
      status: 'DRAFT',
      order: 0,
    })
    setEditingId(null)
    setShowForm(false)
  }

  const platformUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3000')
    : ''

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Statické stránky</h1>
            <p className="text-gray-400">
              Správa statických stránok ako blog, Stať sa predajcom, atď. URL: /{'{slug}'}
            </p>
          </div>

          <div className="mb-6 flex items-center justify-end">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Nová stránka</span>
              </button>
            )}
          </div>

          {showForm && (
            <div className="bg-card rounded-lg p-6 border border-dark mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingId ? 'Upraviť stránku' : 'Nová stránka'}
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
                      placeholder="napr. blog, stat-sa-predajcom"
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                    <p className="text-xs text-gray-500 mt-1">URL bude: /{formData.slug || 'slug'}</p>
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
                      placeholder="napr. Stať sa predajcom"
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Obsah (HTML)
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={12}
                    placeholder="<p>HTML obsah stránky...</p>"
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover font-mono text-sm"
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
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    >
                      <option value="DRAFT">Koncept</option>
                      <option value="PUBLISHED">Publikovaná</option>
                    </select>
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
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-card rounded-lg hover:bg-cardHover transition-colors"
                  >
                    Zrušiť
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Uložiť
                  </button>
                </div>
              </form>
            </div>
          )}

          {loadError && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center justify-between gap-4">
              <p className="text-red-300 text-sm">{loadError}</p>
              <button
                onClick={() => loadPages()}
                className="shrink-0 px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-200 rounded-lg text-sm transition-colors"
              >
                Skúsiť znova
              </button>
            </div>
          )}
          <div className="bg-card rounded-lg border border-dark overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Načítavam...</div>
            ) : pages.length === 0 ? (
              <div className="p-12 text-center">
                <FileCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
                  {loadError ? 'Zoznam sa nenačítal.' : 'Zatiaľ nemáte žiadne statické stránky'}
                </p>
                {!loadError && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="text-primary hover:underline"
                  >
                    Vytvoriť prvú stránku
                  </button>
                )}
                {loadError && (
                  <button
                    onClick={() => loadPages()}
                    className="text-primary hover:underline"
                  >
                    Obnoviť zoznam
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark text-left">
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Slug</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Názov</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Status</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Poradie</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((page) => (
                      <tr key={page.id} className="border-b border-dark hover:bg-cardHover hover:bg-opacity-30 transition-colors">
                        <td className="px-4 py-3">
                          <code className="text-sm text-gray-300">/{page.slug}</code>
                        </td>
                        <td className="px-4 py-3 font-medium">{page.title}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            page.status === 'PUBLISHED' ? 'bg-green-900/50 text-green-400' : 'bg-gray-700 text-gray-400'
                          }`}>
                            {page.status === 'PUBLISHED' ? 'Publikovaná' : 'Koncept'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">{page.order}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {page.status === 'PUBLISHED' && platformUrl && (
                              <a
                                href={`${platformUrl}/${page.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-white transition-colors"
                                title="Zobraziť na stránke"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              onClick={() => handleEdit(page)}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                              title="Upraviť"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(page.id)}
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
        </main>
      </div>
    </div>
  )
}
