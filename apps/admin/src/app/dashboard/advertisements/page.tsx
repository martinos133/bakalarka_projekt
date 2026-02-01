'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { Advertisement, AdvertisementStatus, AdvertisementType, Category } from '@inzertna-platforma/shared'
import { Search, Filter as FilterIcon, TrendingUp, Euro, Tag, BarChart3, Calendar, MapPin, PieChart, FileText, Briefcase, Home } from 'lucide-react'
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type TypeView = 'all' | AdvertisementType.SERVICE | AdvertisementType.RENTAL

export default function AdvertisementsPage() {
  const router = useRouter()
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [typeView, setTypeView] = useState<TypeView>('all')
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

  const displayAds = useMemo(() => {
    if (typeView === 'all') return advertisements
    return advertisements.filter((ad) => (ad as any).type === typeView)
  }, [advertisements, typeView])

  const getFilteredAdvertisements = () => {
    return displayAds.filter((ad) => {
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

  const filteredAdvertisements = useMemo(() => getFilteredAdvertisements(), [displayAds, filters])

  const adsWithPrice = displayAds.filter((ad) => ad.price != null && ad.price > 0)
  const adsWithoutPrice = displayAds.filter((ad) => !ad.price || ad.price === 0)
  const prices = adsWithPrice.map((ad) => ad.price as number)
  const minPrice = prices.length ? Math.min(...prices) : 0
  const maxPrice = prices.length ? Math.max(...prices) : 0
  const totalValue = prices.reduce((sum, p) => sum + p, 0)
  const avgPrice = prices.length ? totalValue / prices.length : 0

  const byStatus = useMemo(() => ({
    active: displayAds.filter((ad) => ad.status === AdvertisementStatus.ACTIVE).length,
    draft: displayAds.filter((ad) => ad.status === AdvertisementStatus.DRAFT).length,
    inactive: displayAds.filter((ad) => ad.status === AdvertisementStatus.INACTIVE).length,
    archived: displayAds.filter((ad) => ad.status === AdvertisementStatus.ARCHIVED).length,
    pending: displayAds.filter((ad) => ad.status === AdvertisementStatus.PENDING).length,
  }), [displayAds])

  const byType = useMemo(() => ({
    services: displayAds.filter((ad) => (ad as any).type === AdvertisementType.SERVICE || !(ad as any).type).length,
    rentals: displayAds.filter((ad) => (ad as any).type === AdvertisementType.RENTAL).length,
  }), [displayAds])

  const byCategory = useMemo(() => {
    const map = new Map<string, number>()
    displayAds.forEach((ad) => {
      const name = (ad as any).category?.name || 'Bez kategórie'
      map.set(name, (map.get(name) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [displayAds])

  const byLocation = useMemo(() => {
    const map = new Map<string, number>()
    displayAds.forEach((ad) => {
      const loc = ad.location?.trim() || 'Nešpecifikované'
      map.set(loc, (map.get(loc) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [displayAds])

  const byMonth = useMemo(() => {
    const map = new Map<string, number>()
    displayAds.forEach((ad) => {
      const d = new Date(ad.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
  }, [displayAds])

  const chartDataByType = useMemo(() => [
    { name: 'Služby', value: byType.services, color: '#3b82f6' },
    { name: 'Prenájom', value: byType.rentals, color: '#a855f7' },
  ].filter((d) => d.value > 0), [byType])

  const chartDataByStatus = useMemo(() => {
    const total = byStatus.active + byStatus.draft + byStatus.inactive + byStatus.archived + byStatus.pending
    const data = [
      { name: 'Aktívne', count: byStatus.active, fill: '#22c55e' },
      { name: 'Koncepty', count: byStatus.draft, fill: '#6b7280' },
      { name: 'Neaktívne', count: byStatus.inactive, fill: '#eab308' },
      { name: 'Archivované', count: byStatus.archived, fill: '#ef4444' },
      { name: 'Čakajúce', count: byStatus.pending, fill: '#3b82f6' },
    ]
    return data.map((d) => ({
      ...d,
      percent: total > 0 ? ((d.count / total) * 100).toFixed(1) : '0',
    }))
  }, [byStatus])

  const chartDataByMonth = useMemo(() =>
    byMonth.map(([month, count]) => ({ month, count, fill: count > 0 ? '#6366f1' : '#374151' })),
  [byMonth])

  const getStatusLabel = (status: AdvertisementStatus) => {
    const labels: Record<string, string> = {
      [AdvertisementStatus.ACTIVE]: 'Aktívny',
      [AdvertisementStatus.DRAFT]: 'Koncept',
      [AdvertisementStatus.INACTIVE]: 'Neaktívny',
      [AdvertisementStatus.ARCHIVED]: 'Archivovaný',
      [AdvertisementStatus.PENDING]: 'Čakajúci',
    }
    return labels[status] ?? status
  }

  const clearFilters = () => {
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

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white">Inzeráty – prehľad pre CEO</h1>
            <p className="text-sm text-gray-400 mt-1">Podrobné štatistiky a agregácie. Správa inzerátov v sekcii Development → Inzeráty.</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setTypeView('all')}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  typeView === 'all' ? 'bg-primary text-white' : 'bg-card border border-dark text-gray-300 hover:bg-cardHover'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Všetky inzeráty
              </button>
              <button
                onClick={() => setTypeView(AdvertisementType.SERVICE)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  typeView === AdvertisementType.SERVICE ? 'bg-blue-600 text-white' : 'bg-card border border-dark text-gray-300 hover:bg-cardHover'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Len služby
              </button>
              <button
                onClick={() => setTypeView(AdvertisementType.RENTAL)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  typeView === AdvertisementType.RENTAL ? 'bg-purple-600 text-white' : 'bg-card border border-dark text-gray-300 hover:bg-cardHover'
                }`}
              >
                <Home className="w-4 h-4" />
                Len prenájom
              </button>
            </div>
          </div>

          {/* Hlavné KPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Celkom inzerátov</span>
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{displayAds.length}</div>
              <div className="text-xs text-gray-500 mt-2">Aktívnych: {byStatus.active} • Konceptov: {byStatus.draft}</div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Aktívne inzeráty</span>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400">{byStatus.active}</div>
              <div className="text-xs text-gray-500 mt-2">
                {displayAds.length ? ((byStatus.active / displayAds.length) * 100).toFixed(1) : 0}% z celkového počtu
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Priemerná cena</span>
                <Euro className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white">{avgPrice.toFixed(2)} €</div>
              <div className="text-xs text-gray-500 mt-2">Celková hodnota: {totalValue.toFixed(2)} €</div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Služby / Prenájom</span>
                <Tag className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white">{byType.services} / {byType.rentals}</div>
              <div className="text-xs text-gray-500 mt-2">Čakajúcich: {byStatus.pending}</div>
            </div>
          </div>

          {/* Grafy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {chartDataByType.length > 0 && (
              <div className="bg-card rounded-lg p-6 border border-dark">
                <h3 className="text-lg font-semibold text-white mb-4">Rozloženie podľa typu</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RechartsPieChart>
                    <Pie
                      data={chartDataByType}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {chartDataByType.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value: number) => [value, '']}
                      labelFormatter={(name) => name}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="bg-card rounded-lg p-6 border border-dark">
              <h3 className="text-lg font-semibold text-white mb-1">Podľa statusu</h3>
              <p className="text-xs text-gray-500 mb-4">Vizuálny prehľad podielov. Presné čísla v tabuľke pod grafom.</p>
              <div className="flex items-center justify-center" style={{ minHeight: 240 }}>
                <ResponsiveContainer width="100%" height={240}>
                  <RechartsPieChart>
                    <Pie
                      data={chartDataByStatus}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={90}
                      paddingAngle={2}
                      stroke="transparent"
                    >
                      {chartDataByStatus.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} stroke="#1f2937" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                      formatter={(value: number, name: string, props: { payload: { percent: string } }) => [
                        `${value} (${props.payload.percent}%)`,
                        name,
                      ]}
                    />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => <span className="text-gray-300">{value}</span>}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 pt-4 border-t border-dark rounded-lg overflow-hidden bg-dark/30">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-dark">
                      <th className="py-2 px-3 font-medium">Status</th>
                      <th className="py-2 px-3 font-medium text-right">Počet</th>
                      <th className="py-2 px-3 font-medium text-right">Podiel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartDataByStatus.map((d) => (
                      <tr key={d.name} className="border-b border-dark/50 last:border-0 hover:bg-dark/30">
                        <td className="py-2 px-3 flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                          <span className="text-gray-200">{d.name}</span>
                        </td>
                        <td className="py-2 px-3 text-right text-white font-medium">{d.count}</td>
                        <td className="py-2 px-3 text-right text-gray-400">{d.percent} %</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {chartDataByMonth.length > 0 && (
              <div className="bg-card rounded-lg p-6 border border-dark">
                <h3 className="text-lg font-semibold text-white mb-4">Inzeráty za mesiace</h3>
                <p className="text-xs text-gray-500 mb-2">Posledných 6 mesiacov. Tmavší stĺpec = 0 inzerátov.</p>
                <div className="bg-dark/50 rounded-lg p-2">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartDataByMonth} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        cursor={{ fill: 'rgba(55, 65, 81, 0.5)' }}
                      />
                      <Bar dataKey="count" name="Počet" radius={[4, 4, 0, 0]} minPointSize={2}>
                        {chartDataByMonth.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Podrobné štatistiky – status, ceny */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-lg p-4 border border-dark">
              <span className="text-xs text-gray-400">Koncepty</span>
              <div className="text-xl font-bold text-gray-300">{byStatus.draft}</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-dark">
              <span className="text-xs text-gray-400">Neaktívne</span>
              <div className="text-xl font-bold text-yellow-400">{byStatus.inactive}</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-dark">
              <span className="text-xs text-gray-400">Archivované</span>
              <div className="text-xl font-bold text-red-400">{byStatus.archived}</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-dark">
              <span className="text-xs text-gray-400">Čakajúce</span>
              <div className="text-xl font-bold text-blue-400">{byStatus.pending}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-lg p-4 border border-dark">
              <span className="text-xs text-gray-400">Min. cena</span>
              <div className="text-xl font-bold text-white">{minPrice.toFixed(2)} €</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-dark">
              <span className="text-xs text-gray-400">Max. cena</span>
              <div className="text-xl font-bold text-white">{maxPrice.toFixed(2)} €</div>
            </div>
            <div className="bg-card rounded-lg p-4 border border-dark">
              <span className="text-xs text-gray-400">S cenou / Bez ceny</span>
              <div className="text-xl font-bold text-white">{adsWithPrice.length} / {adsWithoutPrice.length}</div>
            </div>
          </div>

          {/* Rozloženie podľa kategórie a lokality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-white">Top kategórie</h3>
              </div>
              <ul className="space-y-2">
                {byCategory.length ? byCategory.map(([name, count]) => (
                  <li key={name} className="flex justify-between text-sm">
                    <span className="text-gray-300">{name}</span>
                    <span className="font-semibold text-white">{count}</span>
                  </li>
                )) : (
                  <li className="text-sm text-gray-500">Žiadne dáta</li>
                )}
              </ul>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-white">Top lokality</h3>
              </div>
              <ul className="space-y-2">
                {byLocation.length ? byLocation.map(([loc, count]) => (
                  <li key={loc} className="flex justify-between text-sm">
                    <span className="text-gray-300">{loc}</span>
                    <span className="font-semibold text-white">{count}</span>
                  </li>
                )) : (
                  <li className="text-sm text-gray-500">Žiadne dáta</li>
                )}
              </ul>
            </div>
          </div>

          {/* Inzeráty za mesiace */}
          {byMonth.length > 0 && (
            <div className="bg-card rounded-lg p-6 border border-dark mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-white">Inzeráty za mesiace</h3>
              </div>
              <div className="flex flex-wrap gap-4">
                {byMonth.map(([month, count]) => (
                  <div key={month} className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{month}</span>
                    <span className="font-semibold text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filtre – predvolene zobrazené */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
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
                Zobrazených: <span className="text-white font-semibold">{filteredAdvertisements.length}</span> z {displayAds.length}
              </span>
            </div>
            <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-white transition-colors">
              Vymazať filtre
            </button>
          </div>

          {showFilters && (
            <div className="bg-card rounded-lg p-6 border border-dark mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Filtre pre prehľad</h3>
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
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
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

          {/* Prehľadová tabuľka (iba na čítanie) */}
          <div className="bg-card rounded-lg border border-dark">
            <div className="flex items-center gap-2 p-4 border-b border-dark">
              <FileText className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-white">Zoznam inzerátov (podľa filtrov)</h3>
            </div>
            {loading ? (
              <div className="p-6 text-center text-gray-400">Načítavam...</div>
            ) : filteredAdvertisements.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                {displayAds.length === 0 ? 'Žiadne inzeráty.' : 'Žiadne výsledky podľa filtrov.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark border-b border-card">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Inzerát</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Typ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Kategória</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Cena</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Status</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Lokalita</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Dátum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdvertisements.map((ad) => (
                      <tr key={ad.id} className="border-b border-card hover:bg-dark/50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-white truncate max-w-[200px]">{ad.title}</div>
                          <div className="text-sm text-gray-400 line-clamp-1 max-w-[200px]">{ad.description}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {(ad as any).type === AdvertisementType.RENTAL ? 'Prenájom' : 'Služba'}
                        </td>
                        <td className="px-6 py-4 text-gray-300">{(ad as any).category?.name || '-'}</td>
                        <td className="px-6 py-4 text-green-400">
                          {ad.price != null ? `${ad.price.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-6 py-4 text-gray-300">{getStatusLabel(ad.status)}</td>
                        <td className="px-6 py-4 text-gray-300 text-sm">{ad.location || '-'}</td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(ad.createdAt).toLocaleDateString('sk-SK')}
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
