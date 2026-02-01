'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { Advertisement, AdvertisementStatus, AdvertisementType, CreateAdvertisementDto, Category } from '@inzertna-platforma/shared'
import { Plus, Edit, Trash2, X, Save, Search, Filter as FilterIcon } from 'lucide-react'

export default function DevAdvertisementsPage() {
  const router = useRouter()
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [showFilters, setShowFilters] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: '' as '' | AdvertisementStatus,
    type: '' as '' | AdvertisementType,
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    dateFrom: '',
    dateTo: '',
  })
  const [formData, setFormData] = useState<CreateAdvertisementDto & { status?: AdvertisementStatus }>({
    title: '',
    description: '',
    price: undefined,
    type: AdvertisementType.SERVICE,
    categoryId: '',
    location: '',
    postalCode: '',
    images: [],
    status: AdvertisementStatus.DRAFT,
    pricingType: 'FIXED',
    hourlyRate: undefined,
    dailyRate: undefined,
    packages: [],
    deliveryTime: '',
    revisions: '',
    features: [],
    faq: [],
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadAdvertisements()
    loadCategories()
  }, [router])

  const loadAdvertisements = async () => {
    try {
      setLoading(true)
      const data = await api.getAdvertisements()
      setAdvertisements(data)
    } catch (error) {
      console.error('Chyba pri načítaní inzerátov:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const data = await api.getActiveCategories()
      setCategories(data)
    } catch (error) {
      console.error('Chyba pri načítaní kategórií:', error)
    }
  }

  useEffect(() => {
    if (showForm) loadCategories()
  }, [showForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price.toString()) : undefined,
        images: formData.images || [],
        categoryId: formData.categoryId || undefined,
      }
      if (editingId) {
        await api.updateAdvertisement(editingId, submitData)
      } else {
        const { status, ...createData } = submitData
        await api.createAdvertisement(createData)
      }
      await loadAdvertisements()
      resetForm()
    } catch (error: any) {
      console.error('Chyba pri ukladaní inzerátu:', error)
      alert(error?.message || 'Chyba pri ukladaní inzerátu')
    }
  }

  const handleEdit = (ad: Advertisement) => {
    loadCategories()
    setFormData({
      title: ad.title,
      description: ad.description,
      price: ad.price,
      type: (ad as any).type ?? AdvertisementType.SERVICE,
      categoryId: (ad as any).categoryId || '',
      location: ad.location || '',
      postalCode: ad.postalCode || '',
      images: ad.images || [],
      status: ad.status,
      pricingType: 'FIXED',
      hourlyRate: undefined,
      dailyRate: undefined,
      packages: [],
      deliveryTime: '',
      revisions: '',
      features: [],
      faq: [],
    })
    setEditingId(ad.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Naozaj chcete odstrániť tento inzerát?')) return
    try {
      await api.deleteAdvertisement(id)
      await loadAdvertisements()
    } catch (error) {
      console.error('Chyba pri odstraňovaní inzerátu:', error)
      alert('Chyba pri odstraňovaní inzerátu')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: undefined,
      type: AdvertisementType.SERVICE,
      categoryId: '',
      location: '',
      postalCode: '',
      images: [],
      status: AdvertisementStatus.DRAFT,
      pricingType: 'FIXED',
      hourlyRate: undefined,
      dailyRate: undefined,
      packages: [],
      deliveryTime: '',
      revisions: '',
      features: [],
      faq: [],
    })
    setEditingId(null)
    setShowForm(false)
  }

  const getFilteredAdvertisements = () => {
    return advertisements.filter((ad) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matches =
          ad.title.toLowerCase().includes(searchLower) ||
          ad.description.toLowerCase().includes(searchLower) ||
          ad.location?.toLowerCase().includes(searchLower)
        if (!matches) return false
      }
      if (filters.status && ad.status !== filters.status) return false
      if (filters.type && (ad as any).type !== filters.type) return false
      if (filters.categoryId && (ad as any).categoryId !== filters.categoryId) return false
      if (filters.minPrice && ad.price != null && ad.price < parseFloat(filters.minPrice)) return false
      if (filters.maxPrice && ad.price != null && ad.price > parseFloat(filters.maxPrice)) return false
      if (filters.location && !ad.location?.toLowerCase().includes(filters.location.toLowerCase())) return false
      if (filters.dateFrom && new Date(ad.createdAt) < new Date(filters.dateFrom)) return false
      if (filters.dateTo && new Date(ad.createdAt) > new Date(filters.dateTo)) return false
      return true
    })
  }
  const filteredAdvertisements = getFilteredAdvertisements()

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Development – Inzeráty</h1>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  showFilters ? 'bg-primary text-white' : 'bg-card border border-dark text-gray-300 hover:bg-cardHover'
                }`}
              >
                <FilterIcon className="w-4 h-4" />
                Filtre
                {Object.values(filters).some((v) => v !== '') && (
                  <span className="ml-1 px-2 py-0.5 bg-primary/20 text-primary rounded-full text-xs">
                    {Object.values(filters).filter((v) => v !== '').length}
                  </span>
                )}
              </button>
              <span className="text-sm text-gray-400">
                Zobrazených: <span className="text-white font-semibold">{filteredAdvertisements.length}</span> z {advertisements.length}
              </span>
            </div>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:opacity-90 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nový inzerát
              </button>
            )}
          </div>

          {showFilters && (
            <div className="bg-card rounded-lg p-6 border border-dark mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Pokročilé filtre</h3>
                <button
                  onClick={() =>
                    setFilters({
                      search: '',
                      status: '' as '',
                      type: '' as '',
                      categoryId: '',
                      minPrice: '',
                      maxPrice: '',
                      location: '',
                      dateFrom: '',
                      dateTo: '',
                    })
                  }
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Vymazať filtre
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs text-gray-400 mb-2">Vyhľadávanie</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      placeholder="Názov, popis, lokalita..."
                      className="w-full bg-dark border border-card rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value as '' | AdvertisementStatus })}
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  >
                    <option value="">Všetky</option>
                    <option value={AdvertisementStatus.ACTIVE}>Aktívne</option>
                    <option value={AdvertisementStatus.DRAFT}>Koncepty</option>
                    <option value={AdvertisementStatus.PENDING}>Čakajúce</option>
                    <option value={AdvertisementStatus.INACTIVE}>Neaktívne</option>
                    <option value={AdvertisementStatus.ARCHIVED}>Archivované</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Typ</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value as '' | AdvertisementType })}
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  >
                    <option value="">Všetky</option>
                    <option value={AdvertisementType.SERVICE}>Služby</option>
                    <option value={AdvertisementType.RENTAL}>Prenájom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Kategória</label>
                  <select
                    value={filters.categoryId}
                    onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                  >
                    <option value="">Všetky kategórie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Lokalita</label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                    placeholder="Mesto, región..."
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs text-gray-400 mb-2">Cenové rozpätie (€)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      placeholder="Min"
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                    />
                    <span className="text-gray-400 self-center">–</span>
                    <input
                      type="number"
                      step="0.01"
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      placeholder="Max"
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600"
                    />
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-xs text-gray-400 mb-2">Dátum vytvorenia</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                    />
                    <span className="text-gray-400 self-center">–</span>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {showForm && (
            <div className="bg-card rounded-lg p-6 border border-dark mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {editingId ? 'Upraviť inzerát' : 'Nový inzerát'}
                </h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Názov *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Popis *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Typ</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as AdvertisementType })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600"
                    >
                      <option value={AdvertisementType.SERVICE}>Služba</option>
                      <option value={AdvertisementType.RENTAL}>Prenájom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cena (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price ?? ''}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Kategória</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600"
                    >
                      <option value="">-- Vybrať --</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AdvertisementStatus })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600"
                    >
                      <option value={AdvertisementStatus.DRAFT}>Koncept</option>
                      <option value={AdvertisementStatus.ACTIVE}>Aktívny</option>
                      <option value={AdvertisementStatus.INACTIVE}>Neaktívny</option>
                      <option value={AdvertisementStatus.ARCHIVED}>Archivovaný</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="px-4 py-2 border border-card rounded-lg text-gray-300 hover:bg-cardHover">
                    Zrušiť
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary hover:opacity-90 text-white rounded-lg flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Uložiť
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-card rounded-lg border border-dark">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Načítavam...</div>
            ) : filteredAdvertisements.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                {advertisements.length === 0 ? 'Žiadne inzeráty.' : 'Žiadne výsledky podľa filtrov.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark border-b border-card">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Názov</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Typ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Cena</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Status</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-300">Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdvertisements.map((ad) => (
                      <tr key={ad.id} className="border-b border-card hover:bg-dark/50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white">{ad.title}</div>
                          <div className="text-sm text-gray-400 line-clamp-1">{ad.description}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {(ad as any).type === AdvertisementType.RENTAL ? 'Prenájom' : 'Služba'}
                        </td>
                        <td className="px-6 py-4 text-green-400">
                          {ad.price != null ? `${ad.price.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-300">{ad.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEdit(ad)}
                            className="p-2 text-blue-400 hover:bg-cardHover rounded"
                            title="Upraviť"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="p-2 text-red-400 hover:bg-cardHover rounded"
                            title="Odstrániť"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
