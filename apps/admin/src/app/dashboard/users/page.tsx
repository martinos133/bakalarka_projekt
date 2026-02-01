'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { User } from '@inzertna-platforma/shared'
import { Ban, Unlock, Eye, Calendar, Shield, Mail, Phone, User as UserIcon, MapPin, Building2, CreditCard, X, FileText, Euro, TrendingUp, TrendingDown, Search, Filter as FilterIcon } from 'lucide-react'

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [userStats, setUserStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    role: '' as '' | 'ADMIN' | 'USER',
    status: '' as '' | 'active' | 'banned',
    accountType: '' as '' | 'company' | 'private',
  })
  const [banForm, setBanForm] = useState({
    banned: true,
    banType: 'permanent' as 'permanent' | 'temporary',
    days: 1,
    reason: '',
  })

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadUsers()
  }, [router])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const data = await api.getUsers()
      setUsers(data)
    } catch (error) {
      console.error('Chyba pri načítaní používateľov:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBan = (user: User) => {
    setSelectedUser(user)
    setBanForm({
      banned: true,
      banType: user.bannedUntil ? 'temporary' : 'permanent',
      days: 1,
      reason: user.banReason || '',
    })
    setShowBanModal(true)
  }

  const handleUnban = async (user: User) => {
    if (!confirm(`Naozaj chcete odblokovať používateľa ${user.email}?`)) return

    try {
      await api.banUser(user.id, {
        banned: false,
        bannedUntil: null,
        banReason: null,
      })
      await loadUsers()
    } catch (error) {
      console.error('Chyba pri odblokovaní používateľa:', error)
      alert('Chyba pri odblokovaní používateľa')
    }
  }

  const handleBanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return

    try {
      const bannedUntil = banForm.banType === 'temporary'
        ? new Date(Date.now() + banForm.days * 24 * 60 * 60 * 1000)
        : null

      await api.banUser(selectedUser.id, {
        banned: true,
        bannedUntil: bannedUntil || undefined,
        banReason: banForm.reason || undefined,
      })

      await loadUsers()
      setShowBanModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Chyba pri banovaní používateľa:', error)
      alert('Chyba pri banovaní používateľa')
    }
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

  const getBanStatus = (user: User) => {
    if (!user.banned) return null

    if (user.bannedUntil) {
      const now = new Date()
      const until = typeof user.bannedUntil === 'string' ? new Date(user.bannedUntil) : user.bannedUntil
      if (until > now) {
        const daysLeft = Math.ceil((until.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        return {
          type: 'temporary',
          text: `Dočasný ban do ${formatDate(until)} (${daysLeft} ${daysLeft === 1 ? 'deň' : 'dní'})`,
          color: 'text-yellow-400',
        }
      }
    }

    return {
      type: 'permanent',
      text: 'Trvalý ban',
      color: 'text-red-400',
    }
  }

  const filteredUsers = users.filter((user) => {
    // Vyhľadávanie
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchLower) ||
        user.phone?.includes(filters.search)
      
      if (!matchesSearch) return false
    }

    // Rola
    if (filters.role && user.role !== filters.role) return false

    // Status
    if (filters.status === 'active' && user.banned) return false
    if (filters.status === 'banned' && !user.banned) return false

    // Typ účtu
    if (filters.accountType === 'company' && !user.isCompany) return false
    if (filters.accountType === 'private' && user.isCompany) return false

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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Vyhľadávanie</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    placeholder="Meno, email..."
                    className="w-full bg-dark border border-card rounded-lg px-4 py-2 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Rola</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value as '' | 'ADMIN' | 'USER' })}
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                >
                  <option value="">Všetky</option>
                  <option value="ADMIN">Admin</option>
                  <option value="USER">Používateľ</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as '' | 'active' | 'banned' })}
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                >
                  <option value="">Všetky</option>
                  <option value="active">Aktívny</option>
                  <option value="banned">Zablokovaný</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Typ účtu</label>
                <select
                  value={filters.accountType}
                  onChange={(e) => setFilters({ ...filters, accountType: e.target.value as '' | 'company' | 'private' })}
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                >
                  <option value="">Všetky</option>
                  <option value="company">Spoločnosť</option>
                  <option value="private">Súkromná osoba</option>
                </select>
              </div>
            </div>
            {(filters.search || filters.role || filters.status || filters.accountType) && (
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={() => setFilters({ search: '', role: '', status: '', accountType: '' })}
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
            ) : filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                {users.length === 0 ? 'Žiadni používatelia' : 'Žiadni používatelia nezodpovedajú filtrom'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="px-6 py-3 bg-dark border-b border-card text-sm text-gray-400">
                  Zobrazených: {filteredUsers.length} z {users.length} používateľov
                </div>
                <table className="w-full">
                  <thead className="bg-dark border-b border-card">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Používateľ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Kontakt</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Rola</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Posledné prihlásenie</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Registrácia</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Status</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-300">Akcie</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const banStatus = getBanStatus(user)
                      return (
                        <tr key={user.id} className="border-b border-card hover:bg-dark/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-dark flex items-center justify-center text-white font-semibold">
                                {user.firstName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {user.firstName && user.lastName
                                    ? `${user.firstName} ${user.lastName}`
                                    : user.email}
                                </div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 text-sm text-gray-300">
                                <Mail className="w-4 h-4" />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div className="flex items-center space-x-2 text-sm text-gray-300">
                                  <Phone className="w-4 h-4" />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              user.role === 'ADMIN'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {user.role === 'ADMIN' ? 'Admin' : 'Používateľ'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300 text-sm">
                            {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nikdy'}
                          </td>
                          <td className="px-6 py-4 text-gray-300 text-sm">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            {banStatus ? (
                              <div className="space-y-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${banStatus.color}`}>
                                  {banStatus.text}
                                </span>
                                {user.banReason && (
                                  <div className="text-xs text-gray-400">
                                    {user.banReason}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                                Aktívny
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={async () => {
                                  setSelectedUser(user)
                                  setShowDetailModal(true)
                                  setLoadingStats(true)
                                  try {
                                    const stats = await api.getUserStats(user.id)
                                    setUserStats(stats)
                                  } catch (error) {
                                    console.error('Chyba pri načítaní štatistík:', error)
                                  } finally {
                                    setLoadingStats(false)
                                  }
                                }}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-cardHover rounded transition-colors"
                                title="Zobraziť detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {user.banned ? (
                                <button
                                  onClick={() => handleUnban(user)}
                                  className="p-2 text-green-400 hover:text-green-300 hover:bg-cardHover rounded transition-colors"
                                  title="Odblokovať"
                                >
                                  <Unlock className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBan(user)}
                                  className="p-2 text-red-400 hover:text-red-300 hover:bg-cardHover rounded transition-colors"
                                  title="Zablokovať"
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                              )}
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

          {showDetailModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-card rounded-lg border border-dark w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-card border-b border-dark px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Detail používateľa</h2>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedUser(null)
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Základné informácie */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <UserIcon className="w-5 h-5" />
                      <span>Základné informácie</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Meno</label>
                        <p className="text-white">{selectedUser.firstName || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Priezvisko</label>
                        <p className="text-white">{selectedUser.lastName || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 flex items-center space-x-1">
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </label>
                        <p className="text-white">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 flex items-center space-x-1">
                          <Phone className="w-4 h-4" />
                          <span>Telefón</span>
                        </label>
                        <p className="text-white">{selectedUser.phone || '-'}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Dátum narodenia</span>
                        </label>
                        <p className="text-white">
                          {selectedUser.dateOfBirth ? formatDate(selectedUser.dateOfBirth) : '-'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Pohlavie</label>
                        <p className="text-white">
                          {selectedUser.gender === 'MALE' ? 'Muž' : 
                           selectedUser.gender === 'FEMALE' ? 'Žena' : 
                           selectedUser.gender === 'OTHER' ? 'Iné' : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Spoločnosť */}
                  {selectedUser.isCompany && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <Building2 className="w-5 h-5" />
                        <span>Informácie o spoločnosti</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">Názov spoločnosti</label>
                          <p className="text-white">{selectedUser.companyName || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 flex items-center space-x-1">
                            <CreditCard className="w-4 h-4" />
                            <span>IČO</span>
                          </label>
                          <p className="text-white">{selectedUser.companyId || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">DIČ</label>
                          <p className="text-white">{selectedUser.companyTaxId || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Adresa */}
                  {(selectedUser.address || selectedUser.city || selectedUser.postalCode || selectedUser.country) && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <MapPin className="w-5 h-5" />
                        <span>Adresa</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label className="text-sm text-gray-400">Ulica a číslo</label>
                          <p className="text-white">{selectedUser.address || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Mesto</label>
                          <p className="text-white">{selectedUser.city || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">PSČ</label>
                          <p className="text-white">{selectedUser.postalCode || '-'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400">Krajina</label>
                          <p className="text-white">{selectedUser.country || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Účet a základné informácie */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Účet</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400">Rola</label>
                        <p className="text-white">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedUser.role === 'ADMIN'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {selectedUser.role === 'ADMIN' ? 'Admin' : 'Používateľ'}
                          </span>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Typ účtu</label>
                        <p className="text-white">
                          {selectedUser.isCompany ? 'Spoločnosť' : 'Súkromná osoba'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Registrácia</label>
                        <p className="text-white">{formatDate(selectedUser.createdAt)}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Posledné prihlásenie</label>
                        <p className="text-white">
                          {selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : 'Nikdy'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Status</label>
                        <p className="text-white">
                          {selectedUser.banned ? (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                              Zablokovaný
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                              Aktívny
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Štatistiky */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Štatistiky</span>
                    </h3>
                    {loadingStats ? (
                      <div className="text-center py-4 text-gray-400">Načítavam štatistiky...</div>
                    ) : userStats ? (
                      <div className="space-y-4">
                        {/* Inzeráty */}
                        <div className="bg-dark rounded-lg p-4 border border-card">
                          <div className="flex items-center space-x-2 mb-3">
                            <FileText className="w-5 h-5 text-blue-400" />
                            <h4 className="font-semibold">Inzeráty</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-gray-400">Celkovo vytvorených</label>
                              <p className="text-2xl font-bold text-white">{userStats.totalAdvertisements}</p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-400">Aktívnych</label>
                              <p className="text-2xl font-bold text-green-400">{userStats.activeAdvertisements}</p>
                            </div>
                          </div>
                        </div>

                        {/* Platby - prijaté */}
                        <div className="bg-dark rounded-lg p-4 border border-card">
                          <div className="flex items-center space-x-2 mb-3">
                            <TrendingUp className="w-5 h-5 text-green-400" />
                            <h4 className="font-semibold">Prijaté platby</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-gray-400">Celkovo platieb</label>
                              <p className="text-2xl font-bold text-white">{userStats.paymentsReceived}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {userStats.completedPaymentsReceived} dokončených
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-400">Celková suma</label>
                              <p className="text-2xl font-bold text-green-400">
                                {userStats.paymentsReceivedAmount.toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Platby - uskutočnené */}
                        <div className="bg-dark rounded-lg p-4 border border-card">
                          <div className="flex items-center space-x-2 mb-3">
                            <TrendingDown className="w-5 h-5 text-blue-400" />
                            <h4 className="font-semibold">Uskutočnené platby</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm text-gray-400">Celkovo platieb</label>
                              <p className="text-2xl font-bold text-white">{userStats.paymentsMade}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {userStats.completedPaymentsMade} dokončených
                              </p>
                            </div>
                            <div>
                              <label className="text-sm text-gray-400">Celková suma</label>
                              <p className="text-2xl font-bold text-blue-400">
                                {userStats.paymentsMadeAmount.toFixed(2)} €
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400">Žiadne štatistiky</div>
                    )}
                  </div>

                  {/* Ban informácie */}
                  {selectedUser.banned && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <Ban className="w-5 h-5" />
                        <span>Informácie o banu</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-400">Typ banu</label>
                          <p className="text-white">
                            {selectedUser.bannedUntil ? 'Dočasný ban' : 'Trvalý ban'}
                          </p>
                        </div>
                        {selectedUser.bannedUntil && (
                          <div>
                            <label className="text-sm text-gray-400">Ban do</label>
                            <p className="text-white">{formatDate(selectedUser.bannedUntil)}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <label className="text-sm text-gray-400">Dôvod banu</label>
                          <p className="text-white">{selectedUser.banReason || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Akcie */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-dark">
                    {selectedUser.banned ? (
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          handleUnban(selectedUser)
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>Odblokovať</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowDetailModal(false)
                          handleBan(selectedUser)
                        }}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Zablokovať</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {showBanModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-card rounded-lg p-6 border border-dark w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Zablokovať používateľa</h2>
                <p className="text-gray-400 mb-4">
                  {selectedUser.firstName && selectedUser.lastName
                    ? `${selectedUser.firstName} ${selectedUser.lastName}`
                    : selectedUser.email}
                </p>

                <form onSubmit={handleBanSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Typ banu
                    </label>
                    <select
                      value={banForm.banType}
                      onChange={(e) => setBanForm({ ...banForm, banType: e.target.value as 'permanent' | 'temporary' })}
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    >
                      <option value="permanent">Trvalý ban</option>
                      <option value="temporary">Dočasný ban</option>
                    </select>
                  </div>

                  {banForm.banType === 'temporary' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Počet dní
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={banForm.days}
                        onChange={(e) => setBanForm({ ...banForm, days: parseInt(e.target.value) || 1 })}
                        className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Dôvod banu
                    </label>
                    <textarea
                      value={banForm.reason}
                      onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                      rows={3}
                      placeholder="Napríklad: Porušenie podmienok používania..."
                      className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowBanModal(false)
                        setSelectedUser(null)
                      }}
                      className="px-4 py-2 border border-card rounded-lg text-gray-300 hover:bg-cardHover transition-colors"
                    >
                      Zrušiť
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Zablokovať
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
