'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import {
  Plus,
  Trash2,
  Save,
  Navigation,
  Layout,
  GripVertical,
  ChevronDown,
  ChevronRight,
  FolderTree,
} from 'lucide-react'

interface CategoryOption {
  id: string
  name: string
  slug: string
  parentName?: string
}

interface NavbarItem {
  id: string
  label: string
  href: string
  order: number
}

interface FooterLink {
  id: string
  label: string
  href: string
}

interface FooterSection {
  id: string
  key: string
  title: string
  links: FooterLink[]
}

type TabType = 'navbar' | 'footer'

function generateId() {
  return Math.random().toString(36).slice(2, 11)
}

export default function DevMenuPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('navbar')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [navbarData, setNavbarData] = useState<{ items: NavbarItem[] }>({ items: [] })
  const [footerData, setFooterData] = useState<{ sections: FooterSection[] }>({ sections: [] })
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [showCategoryPicker, setShowCategoryPicker] = useState<'navbar' | string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadMenu()
    loadCategories()
  }, [router])

  useEffect(() => {
    if (!showCategoryPicker) return
    const close = () => setShowCategoryPicker(null)
    const id = setTimeout(() => document.addEventListener('click', close), 0)
    return () => {
      clearTimeout(id)
      document.removeEventListener('click', close)
    }
  }, [showCategoryPicker])


  const loadMenu = async () => {
    try {
      setLoading(true)
      const [navbar, footer] = await Promise.all([
        api.getMenu('navbar'),
        api.getMenu('footer'),
      ])
      setNavbarData(navbar as { items: NavbarItem[] })
      setFooterData(footer as { sections: FooterSection[] })
      const sections = (footer as { sections: FooterSection[] }).sections
      setExpandedSections(new Set(sections.map((s) => s.id)))
    } catch (error) {
      console.error('Chyba pri načítaní menu:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await api.getCategories()
      const options: CategoryOption[] = []
      const list = Array.isArray(data) ? data : []
      for (const cat of list) {
        const parent = cat as {
          id: string
          name: string
          slug: string
          parentId?: string | null
          children?: { id: string; name: string; slug: string }[]
        }
        if (!parent.parentId) {
          options.push({ id: parent.id, name: parent.name, slug: parent.slug || '' })
          for (const child of parent.children || []) {
            options.push({
              id: child.id,
              name: child.name,
              slug: child.slug || '',
              parentName: parent.name,
            })
          }
        }
      }
      setCategories(options)
    } catch (error) {
      console.error('Chyba pri načítaní kategórií:', error)
    }
  }

  const handleSaveNavbar = async () => {
    try {
      setSaving(true)
      setSuccessMessage(null)
      await api.updateMenu('navbar', navbarData)
      setSuccessMessage('Zmeny sú uložené')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      alert(error?.message || 'Chyba pri ukladaní navbaru')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFooter = async () => {
    try {
      setSaving(true)
      setSuccessMessage(null)
      await api.updateMenu('footer', footerData)
      setSuccessMessage('Zmeny sú uložené')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      alert(error?.message || 'Chyba pri ukladaní footera')
    } finally {
      setSaving(false)
    }
  }

  const addNavbarItem = () => {
    const newItem: NavbarItem = {
      id: generateId(),
      label: 'Nová položka',
      href: '#',
      order: navbarData.items.length,
    }
    setNavbarData({
      items: [...navbarData.items, newItem].sort((a, b) => a.order - b.order),
    })
  }

  const addCategoryToNavbar = (cat: CategoryOption) => {
    const newItem: NavbarItem = {
      id: generateId(),
      label: cat.name,
      href: `/kategoria/${cat.slug}`,
      order: navbarData.items.length,
    }
    setNavbarData({
      items: [...navbarData.items, newItem].sort((a, b) => a.order - b.order),
    })
    setShowCategoryPicker(null)
  }

  const updateNavbarItem = (id: string, field: keyof NavbarItem, value: string | number) => {
    setNavbarData({
      items: navbarData.items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    })
  }

  const removeNavbarItem = (id: string) => {
    setNavbarData({
      items: navbarData.items
        .filter((item) => item.id !== id)
        .map((item, i) => ({ ...item, order: i })),
    })
  }

  const updateFooterSection = (sectionId: string, field: 'title' | 'key', value: string) => {
    setFooterData({
      sections: footerData.sections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section
      ),
    })
  }

  const addFooterLink = (sectionId: string) => {
    const newLink: FooterLink = {
      id: generateId(),
      label: 'Nový odkaz',
      href: '#',
    }
    setFooterData({
      sections: footerData.sections.map((section) =>
        section.id === sectionId
          ? { ...section, links: [...section.links, newLink] }
          : section
      ),
    })
  }

  const addCategoryToFooter = (sectionId: string, cat: CategoryOption) => {
    const newLink: FooterLink = {
      id: generateId(),
      label: cat.name,
      href: `/kategoria/${cat.slug}`,
    }
    setFooterData({
      sections: footerData.sections.map((section) =>
        section.id === sectionId
          ? { ...section, links: [...section.links, newLink] }
          : section
      ),
    })
    setShowCategoryPicker(null)
  }

  const updateFooterLink = (
    sectionId: string,
    linkId: string,
    field: keyof FooterLink,
    value: string
  ) => {
    setFooterData({
      sections: footerData.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              links: section.links.map((link) =>
                link.id === linkId ? { ...link, [field]: value } : link
              ),
            }
          : section
      ),
    })
  }

  const removeFooterLink = (sectionId: string, linkId: string) => {
    setFooterData({
      sections: footerData.sections.map((section) =>
        section.id === sectionId
          ? { ...section, links: section.links.filter((link) => link.id !== linkId) }
          : section
      ),
    })
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark text-white flex">
        <Sidebar />
        <div className="flex-1 ml-64">
          <Header />
          <main className="p-6">
            <div className="text-gray-400">Načítavam...</div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Menu – Navbar a Footer</h1>
            <p className="text-gray-400">
              Správa navigačného menu a footer odkazov na platforme
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 px-4 py-3 bg-[#1dbf73]/20 border border-[#1dbf73] rounded-lg text-[#1dbf73] flex items-center gap-2">
              <Save className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('navbar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'navbar'
                  ? 'bg-card text-white'
                  : 'bg-cardHover text-gray-400 hover:text-white'
              }`}
            >
              <Navigation className="w-5 h-5" />
              Navbar
            </button>
            <button
              onClick={() => setActiveTab('footer')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'footer'
                  ? 'bg-card text-white'
                  : 'bg-cardHover text-gray-400 hover:text-white'
              }`}
            >
              <Layout className="w-5 h-5" />
              Footer
            </button>
          </div>

          {/* Navbar tab */}
          {activeTab === 'navbar' && (
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Položky navbaru</h2>
                <div className="flex gap-2">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowCategoryPicker(showCategoryPicker === 'navbar' ? null : 'navbar')
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      <FolderTree className="w-4 h-4" />
                      Pridať kategóriu
                    </button>
                    {showCategoryPicker === 'navbar' && (
                      <div
                        className="absolute top-full left-0 mt-1 w-72 max-h-64 overflow-y-auto bg-dark border border-dark rounded-lg shadow-lg z-20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {categories.length === 0 ? (
                          <p className="p-3 text-gray-500 text-sm">Žiadne kategórie</p>
                        ) : (
                          categories.map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => addCategoryToNavbar(cat)}
                              className="w-full text-left px-3 py-2 hover:bg-cardHover text-sm flex items-center gap-2"
                            >
                              {cat.parentName ? (
                                <>
                                  <span className="text-gray-500">{cat.parentName}</span>
                                  <span>→</span>
                                  <span>{cat.name}</span>
                                </>
                              ) : (
                                <span>{cat.name}</span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={addNavbarItem}
                    className="flex items-center gap-2 px-3 py-2 bg-[#1dbf73] text-white rounded-lg hover:bg-[#19a463] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Pridať položku
                  </button>
                  <button
                    onClick={handleSaveNavbar}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Ukladám...' : 'Uložiť'}
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {navbarData.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 bg-dark rounded-lg border border-dark"
                  >
                    <GripVertical className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-500 w-8">{index + 1}.</span>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => updateNavbarItem(item.id, 'label', e.target.value)}
                      className="flex-1 bg-card border border-dark rounded px-3 py-2 text-white placeholder-gray-500"
                      placeholder="Názov"
                    />
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => updateNavbarItem(item.id, 'href', e.target.value)}
                      className="flex-1 bg-card border border-dark rounded px-3 py-2 text-white placeholder-gray-500"
                      placeholder="Odkaz (href)"
                    />
                    <button
                      onClick={() => removeNavbarItem(item.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                      title="Odstrániť"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {navbarData.items.length === 0 && (
                  <p className="text-gray-500 py-4">Žiadne položky. Kliknite na „Pridať položku“.</p>
                )}
              </div>
            </div>
          )}

          {/* Footer tab */}
          {activeTab === 'footer' && (
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Položky footera</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveFooter}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Ukladám...' : 'Uložiť'}
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {footerData.sections.map((section) => (
                  <div
                    key={section.id}
                    className="border border-dark rounded-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center gap-3 p-4 bg-dark/50 hover:bg-dark/70 transition-colors text-left"
                    >
                      {expandedSections.has(section.id) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) =>
                          updateFooterSection(section.id, 'title', e.target.value)
                        }
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-transparent border-none text-white font-medium focus:outline-none focus:ring-0"
                        placeholder="Názov sekcie"
                      />
                      <span className="text-gray-500 text-sm">({section.links.length} odkazov)</span>
                    </button>
                    {expandedSections.has(section.id) && (
                      <div className="p-4 space-y-3">
                        <div className="flex gap-2 mb-3">
                          <label className="text-gray-400 text-sm w-24">Kľúč:</label>
                          <input
                            type="text"
                            value={section.key}
                            onChange={(e) =>
                              updateFooterSection(section.id, 'key', e.target.value)
                            }
                            className="flex-1 bg-card border border-dark rounded px-3 py-2 text-white text-sm"
                          />
                        </div>
                        {section.links.map((link) => (
                          <div
                            key={link.id}
                            className="flex items-center gap-3 p-2 bg-dark/30 rounded"
                          >
                            <input
                              type="text"
                              value={link.label}
                              onChange={(e) =>
                                updateFooterLink(section.id, link.id, 'label', e.target.value)
                              }
                              className="flex-1 bg-card border border-dark rounded px-3 py-2 text-white text-sm"
                              placeholder="Názov"
                            />
                            <input
                              type="text"
                              value={link.href}
                              onChange={(e) =>
                                updateFooterLink(section.id, link.id, 'href', e.target.value)
                              }
                              className="flex-1 bg-card border border-dark rounded px-3 py-2 text-white text-sm"
                              placeholder="Odkaz"
                            />
                            <button
                              onClick={() => removeFooterLink(section.id, link.id)}
                              className="p-2 text-red-400 hover:text-red-300 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2 flex-wrap">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowCategoryPicker(
                                  showCategoryPicker === section.id ? null : section.id
                                )
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                            >
                              <FolderTree className="w-4 h-4" />
                              Pridať kategóriu
                            </button>
                            {showCategoryPicker === section.id && (
                              <div
                                className="absolute top-full left-0 mt-1 w-72 max-h-64 overflow-y-auto bg-dark border border-dark rounded-lg shadow-lg z-20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {categories.length === 0 ? (
                                  <p className="p-3 text-gray-500 text-sm">Žiadne kategórie</p>
                                ) : (
                                  categories.map((cat) => (
                                    <button
                                      key={cat.id}
                                      onClick={() => addCategoryToFooter(section.id, cat)}
                                      className="w-full text-left px-3 py-2 hover:bg-cardHover text-sm flex items-center gap-2"
                                    >
                                      {cat.parentName ? (
                                        <>
                                          <span className="text-gray-500">{cat.parentName}</span>
                                          <span>→</span>
                                          <span>{cat.name}</span>
                                        </>
                                      ) : (
                                        <span>{cat.name}</span>
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => addFooterLink(section.id)}
                            className="flex items-center gap-2 px-3 py-2 bg-[#1dbf73] text-white rounded-lg hover:bg-[#19a463] transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Pridať položku
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
