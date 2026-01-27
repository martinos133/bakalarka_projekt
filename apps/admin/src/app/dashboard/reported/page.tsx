'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { Report, ReportStatus } from '@inzertna-platforma/shared'
import { Check, X, Eye, Calendar, User, MapPin, DollarSign, Image as ImageIcon, Search, Filter as FilterIcon, Trash2, AlertTriangle } from 'lucide-react'

// Dôvody nahlásenia ako string literály (kvôli problémom s enum importom v Next.js)
type ReportReasonType = 'SPAM' | 'INAPPROPRIATE' | 'FAKE' | 'SCAM' | 'COPYRIGHT' | 'OTHER'

const REPORT_REASONS: ReportReasonType[] = [
  'SPAM',
  'INAPPROPRIATE',
  'FAKE',
  'SCAM',
  'COPYRIGHT',
  'OTHER',
]

const getReasonLabel = (reason: string) => {
  const labels: Record<string, string> = {
    SPAM: 'Spam',
    INAPPROPRIATE: 'Nevhodný obsah',
    FAKE: 'Falošný inzerát',
    SCAM: 'Podvod',
    COPYRIGHT: 'Porušenie autorských práv',
    OTHER: 'Iné',
  }
  return labels[reason] || reason
}

const getReasonColor = (reason: string) => {
  const colors: Record<string, string> = {
    SPAM: 'text-yellow-400',
    INAPPROPRIATE: 'text-red-400',
    FAKE: 'text-orange-400',
    SCAM: 'text-red-500',
    COPYRIGHT: 'text-purple-400',
    OTHER: 'text-gray-400',
  }
  return colors[reason] || 'text-gray-400'
}

export default function ReportedAdvertisementsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [banUser, setBanUser] = useState(false)
  const [banDuration, setBanDuration] = useState<'minutes' | 'hours' | 'days' | 'months' | 'permanent'>('days')
  const [banDurationValue, setBanDurationValue] = useState<number>(1)
  const [banReason, setBanReason] = useState('')
  const [alertModal, setAlertModal] = useState<{
    show: boolean
    message: string
    type: 'error' | 'success' | 'info'
  }>({
    show: false,
    message: '',
    type: 'info',
  })
  const [filters, setFilters] = useState({
    search: '',
    reason: '' as '' | ReportReasonType,
    status: '' as '' | ReportStatus,
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadReports()
  }, [router])

  const loadReports = async () => {
    try {
      setLoading(true)
      const data = await api.getAllReports()
      setReports(data)
    } catch (error) {
      console.error('Chyba pri načítaní nahlásených inzerátov:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (id: string, status: ReportStatus) => {
    if (status === 'RESOLVED') {
      // Zobraz modálny dialóg pre vyriešenie s možnosťou banu
      setShowResolveModal(true)
      return
    }

    // Pre DISMISSED jednoducho zamietni bez banu
    try {
      await api.resolveReport(id, {
        status: 'DISMISSED',
        resolutionNote: resolutionNote || undefined,
      })
      await loadReports()
      setShowDetailModal(false)
      setSelectedReport(null)
      setResolutionNote('')
      setAlertModal({
        show: true,
        message: 'Nahlásenie bolo úspešne zamietnuté',
        type: 'success',
      })
    } catch (error: any) {
      console.error('Chyba pri zamietnutí nahlásenia:', error)
      const errorMessage = error?.message || 'Chyba pri zamietnutí nahlásenia'
      setAlertModal({
        show: true,
        message: errorMessage,
        type: 'error',
      })
    }
  }

  const handleConfirmResolve = async () => {
    if (!selectedReport) return

    if (banUser && banDuration !== 'permanent' && (!banDurationValue || banDurationValue <= 0)) {
      setAlertModal({
        show: true,
        message: 'Prosím zadajte platnú hodnotu trvania banu',
        type: 'error',
      })
      return
    }

    try {
      await api.resolveReport(selectedReport.id, {
        status: 'RESOLVED',
        resolutionNote: resolutionNote || undefined,
        banUser: banUser,
        banDuration: banUser ? banDuration : undefined,
        banDurationValue: banUser && banDuration !== 'permanent' ? banDurationValue : undefined,
        banReason: banUser ? (banReason || resolutionNote) : undefined,
      })
      await loadReports()
      setShowDetailModal(false)
      setShowResolveModal(false)
      setSelectedReport(null)
      setResolutionNote('')
      setBanUser(false)
      setBanDuration('days')
      setBanDurationValue(1)
      setBanReason('')
      setAlertModal({
        show: true,
        message: 'Nahlásenie bolo úspešne vyriešené' + (banUser ? ' a používateľ bol zabanovaný' : ''),
        type: 'success',
      })
    } catch (error: any) {
      console.error('Chyba pri riešení nahlásenia:', error)
      const errorMessage = error?.message || 'Chyba pri riešení nahlásenia'
      setAlertModal({
        show: true,
        message: errorMessage,
        type: 'error',
      })
    }
  }

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    show: boolean
    advertisementId: string
    reportId: string
  }>({
    show: false,
    advertisementId: '',
    reportId: '',
  })

  const handleDeleteAdvertisement = async (advertisementId: string, reportId: string) => {
    setDeleteConfirmModal({
      show: true,
      advertisementId,
      reportId,
    })
  }

  const confirmDeleteAdvertisement = async () => {
    try {
      await api.deleteReportedAdvertisement(deleteConfirmModal.advertisementId, deleteConfirmModal.reportId)
      await loadReports()
      setShowDetailModal(false)
      setSelectedReport(null)
      setDeleteConfirmModal({ show: false, advertisementId: '', reportId: '' })
      setAlertModal({
        show: true,
        message: 'Inzerát bol úspešne odstránený',
        type: 'success',
      })
    } catch (error: any) {
      console.error('Chyba pri odstraňovaní inzerátu:', error)
      const errorMessage = error?.message || 'Chyba pri odstraňovaní inzerátu'
      setAlertModal({
        show: true,
        message: errorMessage,
        type: 'error',
      })
    }
  }

  const handleViewDetail = (report: Report) => {
    setSelectedReport(report)
    setShowDetailModal(true)
    setResolutionNote('')
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

  const filteredReports = reports.filter((report) => {
    // Vyhľadávanie
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const ad = (report as any).advertisement
      const matchesSearch =
        ad?.title?.toLowerCase().includes(searchLower) ||
        ad?.description?.toLowerCase().includes(searchLower) ||
        report.description?.toLowerCase().includes(searchLower) ||
        (report as any).reporter?.email?.toLowerCase().includes(searchLower)
      
      if (!matchesSearch) return false
    }

    // Dôvod
    if (filters.reason && report.reason !== filters.reason) return false

    // Status
    if (filters.status && report.status !== filters.status) return false

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Vyhľadávanie</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Názov inzerátu, popis..."
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Dôvod nahlásenia</label>
                <select
                  value={filters.reason}
                  onChange={(e) => setFilters({ ...filters, reason: e.target.value as '' | ReportReasonType })}
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                >
                  <option value="">Všetky</option>
                  {REPORT_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {getReasonLabel(reason)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as '' | ReportStatus })}
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                >
                  <option value="">Všetky</option>
                  <option value="PENDING">Čakajúce</option>
                  <option value="RESOLVED">Vyriešené</option>
                  <option value="DISMISSED">Zamietnuté</option>
                </select>
              </div>
            </div>
            {(filters.search || filters.reason || filters.status) && (
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={() => setFilters({ search: '', reason: '', status: '' })}
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
            ) : filteredReports.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <p className="text-lg mb-2">
                  {reports.length === 0 
                    ? 'Žiadne nahlásené inzeráty' 
                    : 'Žiadne nahlásenia nezodpovedajú filtrom'}
                </p>
                <p className="text-sm">
                  {reports.length === 0 
                    ? 'Všetky nahlásenia boli spracované' 
                    : `Skúste zmeniť filtre (celkom: ${reports.length})`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="px-6 py-3 bg-dark border-b border-card text-sm text-gray-400">
                  Zobrazených: {filteredReports.length} z {reports.length} nahlásení
                </div>
                <table className="w-full">
                  <thead className="bg-dark border-b border-card">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Inzerát</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Dôvod</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Nahlásil</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Dátum</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-300">Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((report) => {
                      const ad = (report as any).advertisement
                      const reporter = (report as any).reporter
                      return (
                        <tr key={report.id} className="border-b border-card hover:bg-dark/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {ad?.images && ad.images.length > 0 ? (
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
                                <div className="font-medium">{ad?.title || 'Neznámy inzerát'}</div>
                                <div className="text-sm text-gray-400 line-clamp-1">{ad?.description || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`text-sm font-medium ${getReasonColor(report.reason)}`}>
                              {getReasonLabel(report.reason)}
                            </div>
                            {report.description && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-1">{report.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm">
                                  {reporter?.firstName || ''} {reporter?.lastName || ''}
                                </div>
                                <div className="text-xs text-gray-400">{reporter?.email || '-'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{formatDate(report.createdAt)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleViewDetail(report)}
                                className="p-2 bg-dark hover:bg-cardHover rounded-lg transition-colors"
                                title="Zobraziť detail"
                              >
                                <Eye className="w-4 h-4" />
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
          {showDetailModal && selectedReport && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg border border-dark max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-dark">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-6 h-6 text-red-400" />
                      <h2 className="text-2xl font-bold">Detail nahlásenia</h2>
                    </div>
                    <button
                      onClick={() => {
                        setShowDetailModal(false)
                        setSelectedReport(null)
                        setResolutionNote('')
                      }}
                      className="p-2 hover:bg-dark rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Informácie o nahlásení */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Informácie o nahlásení</h3>
                    <div className="bg-dark rounded-lg p-4 space-y-3">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Dôvod</div>
                        <div className={`text-sm font-medium ${getReasonColor(selectedReport.reason)}`}>
                          {getReasonLabel(selectedReport.reason)}
                        </div>
                      </div>
                      {selectedReport.description && (
                        <div>
                          <div className="text-xs text-gray-400 mb-1">Popis</div>
                          <div className="text-sm whitespace-pre-wrap">{selectedReport.description}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Nahlásil</div>
                        <div className="text-sm">
                          {(selectedReport as any).reporter?.firstName} {(selectedReport as any).reporter?.lastName}
                        </div>
                        <div className="text-xs text-gray-400">{(selectedReport as any).reporter?.email}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Dátum nahlásenia</div>
                        <div className="text-sm">{formatDate(selectedReport.createdAt)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Informácie o inzeráte */}
                  {(selectedReport as any).advertisement && (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-400 mb-3">Nahlásený inzerát</h3>
                        <div className="bg-dark rounded-lg p-4 space-y-4">
                          {/* Obrázky */}
                          {(selectedReport as any).advertisement.images && (selectedReport as any).advertisement.images.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-400 mb-2">Obrázky</div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {(selectedReport as any).advertisement.images.map((img: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`${(selectedReport as any).advertisement.title} ${idx + 1}`}
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <div className="text-xs text-gray-400 mb-1">Názov</div>
                            <div className="text-lg font-medium">{(selectedReport as any).advertisement.title}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Popis</div>
                            <div className="text-sm whitespace-pre-wrap">{(selectedReport as any).advertisement.description}</div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {(selectedReport as any).advertisement.price && (
                              <div>
                                <div className="text-xs text-gray-400 mb-1">Cena</div>
                                <div className="text-lg font-medium">{(selectedReport as any).advertisement.price.toFixed(2)} €</div>
                              </div>
                            )}
                            {(selectedReport as any).advertisement.location && (
                              <div>
                                <div className="text-xs text-gray-400 mb-1">Lokalita</div>
                                <div className="text-sm">{(selectedReport as any).advertisement.location}</div>
                              </div>
                            )}
                          </div>
                          {(selectedReport as any).advertisement.user && (
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Vlastník inzerátu</div>
                              <div className="text-sm">
                                {(selectedReport as any).advertisement.user.firstName} {(selectedReport as any).advertisement.user.lastName}
                              </div>
                              <div className="text-xs text-gray-400">{(selectedReport as any).advertisement.user.email}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Poznámka k vyriešeniu */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">Poznámka k vyriešeniu</h3>
                    <textarea
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Zadajte poznámku k vyriešeniu nahlásenia..."
                      className="w-full bg-dark border border-card rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none"
                      rows={4}
                    />
                  </div>

                  {/* Akcie */}
                  <div className="flex items-center justify-between pt-4 border-t border-dark">
                    <button
                      onClick={() => handleDeleteAdvertisement((selectedReport as any).advertisement.id, selectedReport.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Odstrániť inzerát</span>
                    </button>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          setSelectedReport(null)
                          setResolutionNote('')
                        }}
                        className="px-4 py-2 bg-dark hover:bg-cardHover rounded-lg transition-colors"
                      >
                        Zrušiť
                      </button>
                      <button
                        onClick={() => handleResolve(selectedReport.id, 'DISMISSED')}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        Zamietnuť nahlásenie
                      </button>
                      <button
                        onClick={() => handleResolve(selectedReport.id, 'RESOLVED')}
                        className="px-4 py-2 bg-primary hover:opacity-90 rounded-lg transition-colors"
                      >
                        Vyriešiť nahlásenie
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Resolve Modal with Ban Options */}
          {showResolveModal && selectedReport && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
              <div className="bg-card rounded-lg border border-dark max-w-lg w-full shadow-xl">
                <div className="p-6 border-b border-dark">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      Vyriešiť nahlásenie
                    </h2>
                    <button
                      onClick={() => {
                        setShowResolveModal(false)
                        setBanUser(false)
                        setBanDuration('days')
                        setBanDurationValue(1)
                        setBanReason('')
                      }}
                      className="p-2 hover:bg-dark rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Poznámka k vyriešeniu (voliteľné)
                    </label>
                    <textarea
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Zadajte poznámku k vyriešeniu nahlásenia..."
                      className="w-full bg-dark border border-card rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none"
                      rows={4}
                    />
                  </div>

                  <div className="border-t border-dark pt-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={banUser}
                        onChange={(e) => setBanUser(e.target.checked)}
                        className="w-5 h-5 rounded border-card bg-dark text-primary focus:ring-primary focus:ring-offset-dark"
                      />
                      <span className="text-sm font-medium text-white">
                        Zabanovať používateľa
                      </span>
                    </label>
                  </div>

                  {banUser && (
                    <div className="bg-dark rounded-lg p-4 space-y-4 border border-card">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Trvanie banu
                        </label>
                        <select
                          value={banDuration}
                          onChange={(e) => setBanDuration(e.target.value as any)}
                          className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                        >
                          <option value="minutes">Minúty</option>
                          <option value="hours">Hodiny</option>
                          <option value="days">Dni</option>
                          <option value="months">Mesiace</option>
                          <option value="permanent">Navždy</option>
                        </select>
                      </div>

                      {banDuration !== 'permanent' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Počet {banDuration === 'minutes' ? 'minút' : banDuration === 'hours' ? 'hodín' : banDuration === 'days' ? 'dní' : 'mesiacov'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={banDurationValue}
                            onChange={(e) => setBanDurationValue(parseInt(e.target.value) || 1)}
                            className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Dôvod banu (voliteľné)
                        </label>
                        <textarea
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          placeholder="Zadajte dôvod banu..."
                          className="w-full bg-dark border border-card rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark">
                    <button
                      onClick={() => {
                        setShowResolveModal(false)
                        setBanUser(false)
                        setBanDuration('days')
                        setBanDurationValue(1)
                        setBanReason('')
                      }}
                      className="px-4 py-2 bg-dark hover:bg-cardHover rounded-lg transition-colors text-sm font-medium"
                    >
                      Zrušiť
                    </button>
                    <button
                      onClick={handleConfirmResolve}
                      disabled={banUser && banDuration !== 'permanent' && (!banDurationValue || banDurationValue <= 0)}
                      className="px-4 py-2 bg-primary hover:opacity-90 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors text-sm font-medium text-white"
                    >
                      Potvrdiť vyriešenie
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteConfirmModal.show && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg border border-dark max-w-md w-full shadow-xl">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-red-500/20">
                      <Trash2 className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Odstrániť inzerát
                      </h3>
                      <p className="text-gray-300 text-sm mb-6">
                        Naozaj chcete odstrániť tento inzerát? Táto akcia je nezvratná.
                      </p>
                      <div className="flex items-center justify-end space-x-3">
                        <button
                          onClick={() => setDeleteConfirmModal({ show: false, advertisementId: '', reportId: '' })}
                          className="px-4 py-2 bg-dark hover:bg-cardHover rounded-lg transition-colors text-sm font-medium"
                        >
                          Zrušiť
                        </button>
                        <button
                          onClick={confirmDeleteAdvertisement}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm font-medium text-white"
                        >
                          Odstrániť
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
