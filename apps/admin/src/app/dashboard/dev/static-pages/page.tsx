'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { api } from '@/lib/api'
import { PLATFORM_BUILT_IN_PAGES } from '@/lib/platformBuiltInPages'
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  FileCode,
  ExternalLink,
  LayoutTemplate,
  Code2,
  Pencil,
} from 'lucide-react'
import StaticPageVisualEditor, { type StaticPageVisualEditorHandle } from '@/components/StaticPageVisualEditor'
import DashboardLayout from '@/components/DashboardLayout'

function builtInPreviewUrl(platformUrl: string, path: string): string | null {
  if (path.includes('[')) {
    if (path.startsWith('/blog/')) return `${platformUrl}/blog`
    return null
  }
  return `${platformUrl}${path === '/' ? '' : path}`
}

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
  const [contentMode, setContentMode] = useState<'visual' | 'html'>('visual')
  const [editorSession, setEditorSession] = useState(0)
  const [visualNonce, setVisualNonce] = useState(0)
  const [editLoading, setEditLoading] = useState(false)
  const visualEditorRef = useRef<StaticPageVisualEditorHandle>(null)

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
    const content =
      contentMode === 'visual'
        ? visualEditorRef.current?.getContent() ?? formData.content
        : formData.content
    const payload = { ...formData, content }
    try {
      if (editingId) {
        await api.updateStaticPage(editingId, payload)
      } else {
        await api.createStaticPage(payload)
      }
      await loadPages()
      resetForm()
    } catch (error: any) {
      alert(error?.message || 'Chyba pri ukladaní')
    }
  }

  /** Vždy načíta plný záznam z API (vrátane content) – zoznam môže byť orezaný alebo zastaralý. */
  const handleEdit = async (page: StaticPage) => {
    setEditLoading(true)
    try {
      const full = await api.getStaticPage(page.id)
      setFormData({
        slug: full.slug,
        title: full.title,
        // API musí vrátiť text; ak by pole chýbalo alebo bolo null, nech editor neostane na starom obsahu.
        content: full.content != null && typeof full.content === 'string' ? full.content : '',
        metaTitle: full.metaTitle || '',
        metaDescription: full.metaDescription || '',
        status: full.status || 'DRAFT',
        order: full.order ?? 0,
      })
      setEditingId(page.id)
      setContentMode('visual')
      setVisualNonce((n) => n + 1)
      setShowForm(true)
    } catch (error: any) {
      console.error(error)
      alert(error?.message || 'Nepodarilo sa načítať stránku z API.')
    } finally {
      setEditLoading(false)
    }
  }

  const openNewForm = () => {
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
    setContentMode('visual')
    setVisualNonce(0)
    setEditorSession((s) => s + 1)
    setShowForm(true)
  }

  const switchToHtmlSource = () => {
    if (contentMode === 'visual' && visualEditorRef.current) {
      const html = visualEditorRef.current.getContent()
      setFormData((f) => ({ ...f, content: html }))
    }
    setContentMode('html')
  }

  const switchToVisualBuilder = () => {
    setContentMode('visual')
    setVisualNonce((n) => n + 1)
  }

  /** Otvorí úpravu CMS stránky, ktorá na platforme prepíše vestavenú URL (ak je to pre danú routu zapojené). */
  const startCmsOverride = async (cmsSlug: string, suggestedTitle: string) => {
    const existing = pages.find((p) => p.slug === cmsSlug)
    if (existing) {
      await handleEdit(existing)
      return
    }
    setFormData({
      slug: cmsSlug,
      title: suggestedTitle,
      content: '',
      metaTitle: '',
      metaDescription: '',
      status: 'DRAFT',
      order: 0,
    })
    setEditingId(null)
    setContentMode('visual')
    setVisualNonce(0)
    setEditorSession((s) => s + 1)
    setShowForm(true)
  }

  const startCmsOverrideWithPrefix = async (prefix: string, suggestedTitle: string) => {
    const existing = pages.find((p) => p.slug.startsWith(prefix) && p.slug.length > prefix.length)
    if (existing) {
      await handleEdit(existing)
      return
    }
    setFormData({
      slug: prefix,
      title: suggestedTitle,
      content: '',
      metaTitle: '',
      metaDescription: '',
      status: 'DRAFT',
      order: 0,
    })
    setEditingId(null)
    setContentMode('visual')
    setVisualNonce(0)
    setEditorSession((s) => s + 1)
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
    setContentMode('visual')
    setVisualNonce(0)
    setEditorSession((s) => s + 1)
    setShowForm(false)
  }

  const visualEditorKey = `${editingId ?? `new-${editorSession}`}-v${visualNonce}`

  // Rovnaká hodnota na serveri aj klientovi (NEXT_PUBLIC_* je v build-e inlined) – inak hydration mismatch pri náhľadoch.
  const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || 'http://localhost:3000'

  return (
    <DashboardLayout>
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Statické stránky</h1>
            <p className="text-gray-400 max-w-3xl">
              Nižšie sú všetky vestavené stránky platformy (Next.js). Pod nimi upravujete{' '}
              <strong className="text-gray-300">CMS stránky</strong> uložené v databáze – tie sa zobrazujú na URL /{'{slug}'}{' '}
              (okrem vyhradených ciest ako /blog, /mapa, …).
            </p>
          </div>

          <div className="mb-6 flex items-center justify-end gap-3">
            {editLoading && (
              <span className="text-sm text-gray-400">Načítavam stránku…</span>
            )}
            {!showForm && (
              <button
                type="button"
                onClick={openNewForm}
                disabled={editLoading}
                className="bg-primary hover:opacity-90 disabled:opacity-50 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Nová stránka</span>
              </button>
            )}
          </div>

          {showForm && (
            <div className="card p-6 mb-6">
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
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
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
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <label className="block text-sm font-medium text-gray-300">Obsah stránky</label>
                    <div className="flex rounded-xl border border-card overflow-hidden">
                      <button
                        type="button"
                        onClick={switchToVisualBuilder}
                        className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          contentMode === 'visual'
                            ? 'bg-primary text-white'
                            : 'bg-dark text-gray-400 hover:text-white'
                        }`}
                      >
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        Vizual builder
                      </button>
                      <button
                        type="button"
                        onClick={switchToHtmlSource}
                        className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          contentMode === 'html'
                            ? 'bg-primary text-white'
                            : 'bg-dark text-gray-400 hover:text-white'
                        }`}
                      >
                        <Code2 className="w-3.5 h-3.5" />
                        HTML
                      </button>
                    </div>
                  </div>
                  {contentMode === 'visual' ? (
                    <StaticPageVisualEditor
                      key={visualEditorKey}
                      ref={visualEditorRef}
                      initialHtml={formData.content}
                    />
                  ) : (
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={16}
                      placeholder="<p>HTML obsah stránky…</p>"
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover font-mono text-sm"
                    />
                  )}
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
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-gray-600 hover:bg-cardHover"
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
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
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
                    className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Uložiť
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-3">Stránky v kóde (platforma)</h2>
            <p className="text-sm text-gray-500 mb-3 max-w-3xl">
              Každá cesta má v CMS svoj slug (alebo prefix + doplnenie). Po <strong className="text-gray-300">publikovaní</strong>{' '}
              sa na platforme zobrazí váš obsah namiesto predvolenej stránky v kóde. Interaktívne časti (mapa, formuláre)
              po prepísaní zmiznú – na obnovenie zrušte publikovanie alebo zmažte CMS stránku.
            </p>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Cesta</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Názov</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Poznámka</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400 w-36">Správa</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400 w-24">Náhľad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PLATFORM_BUILT_IN_PAGES.map((row) => {
                      const href = builtInPreviewUrl(platformUrl, row.path)
                      const cms = row.cmsOverrideSlug
                      const prefix = row.cmsSlugPrefix
                      return (
                        <tr
                          key={row.path}
                          className="border-b border-white/[0.06] hover:bg-cardHover hover:bg-opacity-30 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <code className="text-sm text-emerald-400/90">{row.path}</code>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-200">{row.title}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{row.note ?? '—'}</td>
                          <td className="px-4 py-3">
                            {cms ? (
                              <button
                                type="button"
                                disabled={editLoading}
                                onClick={() => startCmsOverride(cms, row.title)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-primary/90 hover:bg-primary disabled:opacity-50 text-white transition-colors"
                                title={`CMS slug: ${cms}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Upraviť v CMS
                              </button>
                            ) : prefix ? (
                              <button
                                type="button"
                                disabled={editLoading}
                                onClick={() => startCmsOverrideWithPrefix(prefix, row.title)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-primary/90 hover:bg-primary disabled:opacity-50 text-white transition-colors"
                                title={`Doplňte slug za „${prefix}“ podľa poznámky v stĺpci Poznámka`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Upraviť v CMS
                              </button>
                            ) : (
                              <span className="text-xs text-gray-600">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {href ? (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex p-2 text-gray-400 hover:text-white transition-colors"
                                title="Otvoriť na platforme"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-xs text-gray-600 px-2">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {loadError && (
            <div className="mb-4 p-4 bg-red-900/20 border border-red-800 rounded-xl flex items-center justify-between gap-4">
              <p className="text-red-300 text-sm">{loadError}</p>
              <button
                onClick={() => loadPages()}
                className="shrink-0 px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-200 rounded-xl text-sm transition-colors"
              >
                Skúsiť znova
              </button>
            </div>
          )}

          <h2 className="text-lg font-semibold text-white mb-3">CMS stránky (databáza)</h2>
          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Načítavam CMS stránky…</div>
            ) : pages.length === 0 ? (
              <div className="p-12 text-center">
                <FileCode className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
                  {loadError
                    ? 'Zoznam CMS stránok sa nenačítal.'
                    : 'V databáze zatiaľ nemáte žiadne CMS stránky (voliteľný obsah na /slug).'}
                </p>
                {!loadError && (
                  <button
                    type="button"
                    onClick={openNewForm}
                    className="text-primary hover:underline"
                  >
                    Vytvoriť prvú CMS stránku
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
                    <tr className="border-b border-white/[0.06] text-left">
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Slug</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Názov</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Status</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Poradie</th>
                      <th className="px-4 py-3 text-sm font-semibold text-gray-400">Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pages.map((page) => (
                      <tr key={page.id} className="border-b border-white/[0.06] hover:bg-cardHover hover:bg-opacity-30 transition-colors">
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
                            {page.status === 'PUBLISHED' && (
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
                              type="button"
                              disabled={editLoading}
                              onClick={() => handleEdit(page)}
                              className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-40"
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
        </DashboardLayout>
  )
}
