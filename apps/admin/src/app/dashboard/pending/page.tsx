'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { Advertisement } from '@inzertna-platforma/shared'
import { Check, X, Eye, Calendar, User, MapPin, Euro, Image as ImageIcon, Search, Filter as FilterIcon, AlertCircle } from 'lucide-react'

export default function PendingAdvertisementsPage() {
  const router = useRouter()
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [filters, setFilters] = useState({
    search: '',
    categoryId: '',
    minPrice: '',
    maxPrice: '',
    location: '',
  })
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean
    type: 'approve' | 'reject'
    message: string
    onConfirm: () => void
  }>({
    show: false,
    type: 'approve',
    message: '',
    onConfirm: () => {},
  })
  const [alertModal, setAlertModal] = useState<{
    show: boolean
    message: string
    type: 'error' | 'success' | 'info'
  }>({
    show: false,
    message: '',
    type: 'info',
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadPendingAdvertisements()
    loadCategories()
  }, [router])

  const loadCategories = async () => {
    try {
      const data = await api.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Chyba pri načítaní kategórií:', error)
    }
  }

  const loadPendingAdvertisements = async () => {
    try {
      setLoading(true)
      const data = await api.getPendingAdvertisements()
      setAdvertisements(data)
    } catch (error) {
      console.error('Chyba pri načítaní čakajúcich inzerátov:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    setConfirmModal({
      show: true,
      type: 'approve',
      message: 'Naozaj chcete schváliť tento inzerát?',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false })
        try {
          await api.approveAdvertisement(id)
          await loadPendingAdvertisements()
          if (selectedAd?.id === id) {
            setShowDetailModal(false)
            setSelectedAd(null)
          }
          setAlertModal({
            show: true,
            message: 'Inzerát bol úspešne schválený',
            type: 'success',
          })
        } catch (error: any) {
          console.error('Chyba pri schvaľovaní inzerátu:', error)
          const errorMessage = error?.message || 'Chyba pri schvaľovaní inzerátu'
          setAlertModal({
            show: true,
            message: errorMessage,
            type: 'error',
          })
          // Obnovíme zoznam, aby sa odstránil už spracovaný inzerát
          await loadPendingAdvertisements()
        }
      },
    })
  }

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      setAlertModal({
        show: true,
        message: 'Prosím zadajte dôvod zamietnutia',
        type: 'error',
      })
      return
    }

    setConfirmModal({
      show: true,
      type: 'reject',
      message: 'Naozaj chcete zamietnuť tento inzerát?',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, show: false })
        try {
          await api.rejectAdvertisement(id, rejectReason)
          await loadPendingAdvertisements()
          setShowDetailModal(false)
          setSelectedAd(null)
          setRejectReason('')
          setAlertModal({
            show: true,
            message: 'Inzerát bol úspešne zamietnutý',
            type: 'success',
          })
        } catch (error: any) {
          console.error('Chyba pri zamietnutí inzerátu:', error)
          const errorMessage = error?.message || 'Chyba pri zamietnutí inzerátu'
          setAlertModal({
            show: true,
            message: errorMessage,
            type: 'error',
          })
          // Obnovíme zoznam, aby sa odstránil už spracovaný inzerát
          await loadPendingAdvertisements()
        }
      },
    })
  }

  const handleViewDetail = (ad: Advertisement) => {
    setSelectedAd(ad)
    setShowDetailModal(true)
    setRejectReason('')
  }

  const formatDate = (date?: Date | string) => {
    if (!date) return '-'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('sk-SK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredAdvertisements = advertisements.filter((ad) => {
    // Vyhľadávanie
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        ad.title.toLowerCase().includes(searchLower) ||
        ad.description?.toLowerCase().includes(searchLower) ||
        (ad as any).user?.email?.toLowerCase().includes(searchLower) ||
        `${(ad as any).user?.firstName || ''} ${(ad as any).user?.lastName || ''}`.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Kategória
    if (filters.categoryId && (ad as any).categoryId !== filters.categoryId) return false

    // Cena
    if (filters.minPrice && (!ad.price || ad.price < parseFloat(filters.minPrice))) return false
    if (filters.maxPrice && (!ad.price || ad.price > parseFloat(filters.maxPrice))) return false

    // Lokalita
    if (filters.location && ad.location) {
      if (!ad.location.toLowerCase().includes(filters.location.toLowerCase())) return false
    } else if (filters.location && !ad.location) return false

    return true
  })

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          {/* Filtre */}
          <div className="bg-card rounded-lg p-4 border border-dark mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <FilterIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-300">Filtre</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Vyhľadávanie</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Názov, popis, používateľ..."
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Kategória</label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                >
                  <option value="">Všetky</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Min. cena (€)</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Max. cena (€)</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                  placeholder="∞"
                  min="0"
                  step="0.01"
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover placeholder-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Lokalita</label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  placeholder="Mesto, región..."
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover placeholder-gray-500"
                />
              </div>
            </div>
            {(filters.search || filters.categoryId || filters.minPrice || filters.maxPrice || filters.location) && (
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={() => setFilters({ search: '', categoryId: '', minPrice: '', maxPrice: '', location: '' })}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Vymazať filtre
                </button>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-dark">
            {loading ? (
              <div className="p-6 text-center text-gray-400">Načítavam...</div>
            ) : filteredAdvertisements.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p className="text-lg mb-2">
                  {advertisements.length === 0 
                    ? 'Žiadne čakajúce inzeráty' 
                    : 'Žiadne inzeráty nezodpovedajú filtrom'}
                </p>
                <p className="text-sm">
                  {advertisements.length === 0 
                    ? 'Všetky inzeráty boli spracované' 
                    : `Skúste zmeniť filtre (celkom: ${advertisements.length})`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="px-6 py-3 bg-dark border-b border-card text-sm text-gray-400">
                  Zobrazených: {filteredAdvertisements.length} z {advertisements.length} čakajúcich inzerátov
                </div>
                <table className="w-full">
                  <thead className="bg-dark border-b border-card">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Inzerát</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Používateľ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Kategória</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Cena</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Lokalita</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Vytvorené</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-300">Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdvertisements.map((ad) => {
                      const user = (ad as any).user
                      const category = (ad as any).category
                      return (
                        <tr key={ad.id} className="border-b border-card hover:bg-dark/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {ad.images && ad.images.length > 0 ? (
                                <img
                                  src={ad.images[0]}
                                  alt={ad.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-dark rounded flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{ad.title}</div>
                                <div className="text-sm text-gray-400 line-clamp-1">{ad.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm">
                                  {user?.firstName || ''} {user?.lastName || ''}
                                </div>
                                <div className="text-xs text-gray-400">{user?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {category ? (
                              <span className="px-2 py-1 bg-dark rounded text-sm">{category.name}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {ad.price ? (
                              <div className="flex items-center space-x-1">
                                <Euro className="w-4 h-4 text-gray-400" />
                                <span>{ad.price.toFixed(2)} €</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {ad.location ? (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-sm">{ad.location}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{formatDate(ad.createdAt)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewDetail(ad)}
                                className="p-2 bg-dark hover:bg-cardHover rounded-lg transition-colors"
                                title="Zobraziť detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleApprove(ad.id)}
                                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                title="Schváliť"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedAd(ad)
                                  setShowDetailModal(true)
                                }}
                                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                                title="Zamietnuť"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Detail Modal */}
          {showDetailModal && selectedAd && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg border border-dark max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-dark">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Detail inzerátu</h2>
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        setSelectedAd(null)
                        setRejectReason('')
                      }}
                      className="p-2 hover:bg-dark rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Obrázky */}
                  {selectedAd.images && selectedAd.images.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-3">Obrázky</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {selectedAd.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`${selectedAd.title} ${idx + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Základné informácie */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Základné informácie</h3>
                    <div className="bg-dark rounded-lg p-4 space-y-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Názov</div>
                        <div className="text-lg font-medium">{selectedAd.title}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Popis</div>
                        <div className="text-sm whitespace-pre-wrap">{selectedAd.description}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedAd.price && (
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Cena</div>
                            <div className="text-lg font-medium">{selectedAd.price.toFixed(2)} €</div>
                          </div>
                        )}
                        {selectedAd.location && (
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Lokalita</div>
                            <div className="text-sm">{selectedAd.location}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Používateľ */}
                  {(selectedAd as any).user && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-3">Používateľ</h3>
                      <div className="bg-dark rounded-lg p-4">
                        <div className="text-sm">
                          {(selectedAd as any).user.firstName} {(selectedAd as any).user.lastName}
                        </div>
                        <div className="text-xs text-gray-400">{(selectedAd as any).user.email}</div>
                        {(selectedAd as any).user.phone && (
                          <div className="text-xs text-gray-400">{(selectedAd as any).user.phone}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Kategória */}
                  {(selectedAd as any).category && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 mb-3">Kategória</h3>
                      <div className="bg-dark rounded-lg p-4">
                        <div className="text-sm">{(selectedAd as any).category.name}</div>
                      </div>
                    </div>
                  )}

                  {/* Dôvod zamietnutia */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Dôvod zamietnutia</h3>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Zadajte dôvod zamietnutia inzerátu..."
                      className="w-full bg-dark border border-card rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none"
                      rows={4}
                    />
                  </div>

                  {/* Akcie */}
                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-dark">
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        setSelectedAd(null)
                        setRejectReason('')
                      }}
                      className="px-4 py-2 bg-dark hover:bg-cardHover rounded-lg transition-colors"
                    >
                      Zrušiť
                    </button>
                    <button
                      onClick={() => handleReject(selectedAd.id)}
                      disabled={!rejectReason.trim()}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      Zamietnuť
                    </button>
                    <button
                      onClick={() => handleApprove(selectedAd.id)}
                      className="px-4 py-2 bg-primary hover:opacity-90 rounded-lg transition-colors"
                    >
                      Schváliť
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {confirmModal.show && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg border border-dark max-w-md w-full shadow-xl">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      confirmModal.type === 'approve' 
                        ? 'bg-green-500/20' 
                        : 'bg-red-500/20'
                    }`}>
                      <AlertCircle className={`w-6 h-6 ${
                        confirmModal.type === 'approve' 
                          ? 'text-green-400' 
                          : 'text-red-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {confirmModal.type === 'approve' ? 'Schváliť inzerát' : 'Zamietnuť inzerát'}
                      </h3>
                      <p className="text-gray-300 text-sm mb-6">
                        {confirmModal.message}
                      </p>
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                          className="px-4 py-2 bg-dark hover:bg-cardHover rounded-lg transition-colors text-sm font-medium"
                        >
                          Zrušiť
                        </button>
                        <button
                          onClick={confirmModal.onConfirm}
                          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium text-white ${
                            confirmModal.type === 'approve'
                              ? 'bg-primary hover:opacity-90'
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Alert Modal */}
          {alertModal.show && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg border border-dark max-w-md w-full shadow-xl">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      alertModal.type === 'success'
                        ? 'bg-green-500/20'
                        : alertModal.type === 'error'
                        ? 'bg-red-500/20'
                        : 'bg-blue-500/20'
                    }`}>
                      {alertModal.type === 'success' ? (
                        <Check className="w-6 h-6 text-green-400" />
                      ) : alertModal.type === 'error' ? (
                        <X className="w-6 h-6 text-red-400" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {alertModal.type === 'success'
                          ? 'Úspech'
                          : alertModal.type === 'error'
                          ? 'Chyba'
                          : 'Informácia'}
                      </h3>
                      <p className="text-gray-300 text-sm mb-6">
                        {alertModal.message}
                      </p>
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => setAlertModal({ ...alertModal, show: false })}
                          className="px-4 py-2 bg-primary hover:opacity-90 rounded-lg transition-colors text-sm font-medium text-white"
                        >
                          OK
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
