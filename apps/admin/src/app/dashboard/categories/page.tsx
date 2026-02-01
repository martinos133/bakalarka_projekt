'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { Category, CategoryStatus } from '@inzertna-platforma/shared'
import { FolderTree, FolderOpen, Folder, Search, Filter as FilterIcon, BarChart3 } from 'lucide-react'
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'

export default function CategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [advertisements, setAdvertisements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    status: '' as '' | CategoryStatus,
    type: '' as '' | 'main' | 'sub',
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [catsData, adsData] = await Promise.all([
        api.getCategories(),
        api.getAdvertisements().catch(() => []),
      ])
      setCategories(catsData)
      setAdvertisements(adsData || [])
    } catch (error) {
      console.error('Chyba pri načítaní kategórií:', error)
    } finally {
      setLoading(false)
    }
  }

  const mainCategories = useMemo(() => categories.filter((c) => !c.parentId), [categories])
  const subCategories = useMemo(() => categories.filter((c) => c.parentId), [categories])

  const adCountByCategoryId = useMemo(() => {
    const map = new Map<string, number>()
    advertisements.forEach((ad: any) => {
      const id = ad.categoryId || ad.category?.id
      if (id) map.set(id, (map.get(id) || 0) + 1)
    })
    return map
  }, [advertisements])

  const byStatus = useMemo(
    () => ({
      active: categories.filter((c) => c.status === CategoryStatus.ACTIVE).length,
      draft: categories.filter((c) => c.status === CategoryStatus.DRAFT).length,
      inactive: categories.filter((c) => c.status === CategoryStatus.INACTIVE).length,
    }),
    [categories]
  )

  const topCategoriesByAds = useMemo(() => {
    return categories
      .map((c) => ({
        id: c.id,
        name: c.name,
        count: adCountByCategoryId.get(c.id) || (c._count as any)?.advertisements || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [categories, adCountByCategoryId])

  const chartDataByStatus = useMemo(() => {
    const total = byStatus.active + byStatus.draft + byStatus.inactive
    return [
      { name: 'Aktívne', count: byStatus.active, fill: '#22c55e' },
      { name: 'Koncept', count: byStatus.draft, fill: '#6b7280' },
      { name: 'Neaktívne', count: byStatus.inactive, fill: '#ef4444' },
    ].map((d) => ({ ...d, percent: total > 0 ? ((d.count / total) * 100).toFixed(1) : '0' }))
  }, [byStatus])

  const chartDataByType = useMemo(
    () => [
      { name: 'Hlavné kategórie', count: mainCategories.length, fill: '#3b82f6' },
      { name: 'Podkategórie', count: subCategories.length, fill: '#a855f7' },
    ],
    [mainCategories.length, subCategories.length]
  )

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (!c.name.toLowerCase().includes(q) && !(c.slug || '').toLowerCase().includes(q)) return false
      }
      if (filters.status && c.status !== filters.status) return false
      if (filters.type === 'main' && c.parentId) return false
      if (filters.type === 'sub' && !c.parentId) return false
      return true
    })
  }, [categories, filters])

  const getStatusLabel = (status: CategoryStatus) => {
    const labels: Record<CategoryStatus, string> = {
      [CategoryStatus.ACTIVE]: 'Aktívna',
      [CategoryStatus.DRAFT]: 'Koncept',
      [CategoryStatus.INACTIVE]: 'Neaktívna',
    }
    return labels[status] ?? status
  }

  const getChildrenCount = (categoryId: string) =>
    categories.filter((c) => c.parentId === categoryId).length

  const clearFilters = () =>
    setFilters({ search: '', status: '' as '', type: '' as '' })

  const hasActiveFilters = filters.search || filters.status || filters.type

  return (
    <div className="min-h-screen bg-dark text-gray-200 flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-200">Kategórie</h1>
            <p className="text-sm text-gray-400 mt-1">Podrobný prehľad kategórií, štatistiky a rozloženie.</p>
          </div>

          {/* KPI karty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <FolderTree className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-xs text-gray-400">Celkom kategórií</span>
                  <div className="text-2xl font-bold text-gray-200">{categories.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <FolderOpen className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <span className="text-xs text-gray-400">Hlavné kategórie</span>
                  <div className="text-2xl font-bold text-gray-200">{mainCategories.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Folder className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <span className="text-xs text-gray-400">Podkategórie</span>
                  <div className="text-2xl font-bold text-gray-200">{subCategories.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <span className="text-xs text-gray-400">Aktívne / Koncept / Neaktívne</span>
                  <div className="text-xl font-bold text-gray-200">
                    {byStatus.active} / {byStatus.draft} / {byStatus.inactive}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grafy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-card rounded-lg p-6 border border-dark">
              <h3 className="text-lg font-semibold text-gray-200 mb-1">Podľa statusu</h3>
              <p className="text-xs text-gray-500 mb-4">Aktívne, koncept, neaktívne.</p>
              <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsPieChart>
                    <Pie
                      data={chartDataByStatus}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={76}
                      paddingAngle={2}
                      stroke="transparent"
                    >
                      {chartDataByStatus.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} stroke="#1f2937" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af' }}
                      labelStyle={{ color: '#9ca3af' }}
                      cursor={false}
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
              <div className="mt-4 pt-4 border-t border-dark overflow-hidden">
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
                        <td className="py-2 px-3 text-right text-gray-200 font-medium">{d.count}</td>
                        <td className="py-2 px-3 text-right text-gray-400">{d.percent} %</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-dark overflow-hidden">
              <div className="p-4 border-b border-dark">
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide text-gray-400">
                  Hlavné vs. podkategórie
                </h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-dark/40 border border-dark/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-300">Hlavné</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-200 tabular-nums">{mainCategories.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">kategórií</div>
                  {categories.length > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-dark overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${(mainCategories.length / categories.length) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="rounded-lg bg-dark/40 border border-dark/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-300">Podkategórie</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-200 tabular-nums">{subCategories.length}</div>
                  <div className="text-xs text-gray-500 mt-0.5">kategórií</div>
                  {categories.length > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-dark overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all"
                        style={{ width: `${(subCategories.length / categories.length) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4 pt-0">
                <div className="pt-1">
                  <p className="text-xs text-gray-500 mb-2">Graf</p>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart
                      data={chartDataByType}
                      layout="vertical"
                      margin={{ top: 8, right: 36, left: 56, bottom: 8 }}
                      barCategoryGap={8}
                    >
                      <XAxis type="number" domain={[0, Math.max(mainCategories.length, subCategories.length, 1)]} hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={52}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af' }}
                        labelStyle={{ color: '#9ca3af' }}
                        cursor={false}
                        formatter={(value: number) => [value, '']}
                      />
                      <Bar dataKey="count" nameKey="name" radius={[0, 4, 4, 0]} barSize={20} minPointSize={4}>
                        {chartDataByType.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="count" position="right" fill="#9ca3af" fontSize={12} fontWeight={600} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-lg p-6 border border-dark">
              <h3 className="text-lg font-semibold text-gray-200 mb-1">Top kategórie podľa inzerátov</h3>
              <p className="text-xs text-gray-500 mb-4">Kategórie s najväčším počtom inzerátov.</p>
              {topCategoriesByAds.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={Math.max(180, topCategoriesByAds.length * 28)}>
                    <BarChart
                      data={topCategoriesByAds}
                      layout="vertical"
                      margin={{ top: 4, right: 48, left: 4, bottom: 4 }}
                      barCategoryGap={6}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fill: '#9ca3af', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        interval={0}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af' }}
                        cursor={false}
                        formatter={(value: number) => [value, 'inzerátov']}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={18} minPointSize={2}>
                        <LabelList dataKey="count" position="right" fill="#9ca3af" fontSize={11} fontWeight={600} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className="text-sm text-gray-500 py-4">Žiadne inzeráty v kategóriách.</p>
              )}
            </div>
          </div>

          {/* Filtre */}
          <div className="bg-card rounded-lg p-4 border border-dark mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <FilterIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-300">Filtre</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Vyhľadávanie</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Názov, slug..."
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 pl-10 text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as '' | CategoryStatus })}
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-gray-200 text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                >
                  <option value="">Všetky</option>
                  <option value={CategoryStatus.ACTIVE}>Aktívna</option>
                  <option value={CategoryStatus.DRAFT}>Koncept</option>
                  <option value={CategoryStatus.INACTIVE}>Neaktívna</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Typ</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as '' | 'main' | 'sub' })}
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-gray-200 text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                >
                  <option value="">Všetky</option>
                  <option value="main">Hlavné kategórie</option>
                  <option value="sub">Podkategórie</option>
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  Vymazať filtre
                </button>
              </div>
            )}
          </div>

          {/* Tabuľka kategórií */}
          <div className="bg-card rounded-lg border border-dark">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Načítavam...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                {categories.length === 0 ? 'Žiadne kategórie' : 'Žiadne kategórie nezodpovedajú filtrom'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="px-6 py-3 bg-dark border-b border-card text-sm text-gray-400">
                  Zobrazených: {filteredCategories.length} z {categories.length} kategórií
                </div>
                <table className="w-full">
                  <thead className="bg-dark border-b border-card">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Kategória</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Typ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Status</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Podkategórie</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Inzeráty</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Poradie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((cat) => {
                      const childrenCount = getChildrenCount(cat.id)
                      const adsCount = adCountByCategoryId.get(cat.id) ?? (cat._count as any)?.advertisements ?? 0
                      return (
                        <tr key={cat.id} className="border-b border-card hover:bg-dark/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <FolderTree className="w-4 h-4 text-gray-400 shrink-0" />
                              <div>
                                <div className="font-medium text-gray-200">{cat.name}</div>
                                <div className="text-xs text-gray-500">{cat.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                cat.parentId ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                              }`}
                            >
                              {cat.parentId ? 'Podkategória' : 'Hlavná'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                cat.status === CategoryStatus.ACTIVE
                                  ? 'bg-green-500/20 text-green-400'
                                  : cat.status === CategoryStatus.DRAFT
                                    ? 'bg-gray-500/20 text-gray-400'
                                    : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {getStatusLabel(cat.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300 text-sm tabular-nums">{childrenCount}</td>
                          <td className="px-6 py-4 text-gray-300 text-sm tabular-nums">{adsCount}</td>
                          <td className="px-6 py-4 text-gray-400 text-sm tabular-nums">{cat.order}</td>
                        </tr>
                      )
                    })}
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
