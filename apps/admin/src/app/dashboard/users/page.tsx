'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { api } from '@/lib/api'
import { User, Gender } from '@inzertna-platforma/shared'
import { Ban, Unlock, Eye, Calendar, Shield, Mail, Phone, User as UserIcon, MapPin, Building2, CreditCard, X, FileText, Euro, TrendingUp, TrendingDown, Search, Filter as FilterIcon, Users, UserCheck, UserX, Building, UserCog } from 'lucide-react'
import { PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'
import ConfirmDialog from '@/components/ConfirmDialog'
import AlertDialog from '@/components/AlertDialog'

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showBanModal, setShowBanModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [unblockConfirmUser, setUnblockConfirmUser] = useState<User | null>(null)
  const [alertMessage, setAlertMessage] = useState<{ title: string; message: string } | null>(null)
  const [userStats, setUserStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [filters, setFilters] = useState({
    search: '',
    role: '' as '' | 'ADMIN' | 'USER',
    status: '' as '' | 'active' | 'banned',
    accountType: '' as '' | 'company' | 'private',
    gender: '' as '' | Gender,
    minAge: '',
    maxAge: '',
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

  const handleUnbanClick = (user: User) => {
    setUnblockConfirmUser(user)
  }

  const handleUnbanConfirm = async () => {
    if (!unblockConfirmUser) return
    const user = unblockConfirmUser
    setUnblockConfirmUser(null)
    try {
      await api.banUser(user.id, {
        banned: false,
        bannedUntil: null,
        banReason: null,
      })
      await loadUsers()
    } catch (error) {
      console.error('Chyba pri odblokovaní používateľa:', error)
      setAlertMessage({ title: 'Chyba', message: 'Chyba pri odblokovaní používateľa.' })
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
      setAlertMessage({ title: 'Chyba', message: 'Chyba pri banovaní používateľa.' })
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

  const getAge = (dateOfBirth?: Date | string | null): number | null => {
    if (!dateOfBirth) return null
    const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth
    const today = new Date()
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
    return age >= 0 ? age : null
  }

  const getGenderLabel = (gender?: Gender | string | null) => {
    if (!gender) return '-'
    if (gender === Gender.MALE) return 'Muž'
    if (gender === Gender.FEMALE) return 'Žena'
    if (gender === Gender.OTHER) return 'Iné'
    return '-'
  }

  const getAccountTypeLabel = (isCompany: boolean) => (isCompany ? 'Firma' : 'Osoba')

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

    // Pohlavie
    if (filters.gender && user.gender !== filters.gender) return false

    // Vek
    const age = getAge(user.dateOfBirth)
    if (filters.minAge) {
      const min = parseInt(filters.minAge, 10)
      if (!isNaN(min) && (age === null || age < min)) return false
    }
    if (filters.maxAge) {
      const max = parseInt(filters.maxAge, 10)
      if (!isNaN(max) && (age === null || age > max)) return false
    }

    return true
  })

  const byRole = useMemo(() => ({
    admin: users.filter((u) => u.role === 'ADMIN').length,
    user: users.filter((u) => u.role === 'USER').length,
  }), [users])

  const byStatus = useMemo(() => ({
    active: users.filter((u) => !u.banned).length,
    banned: users.filter((u) => u.banned).length,
  }), [users])

  const byAccountType = useMemo(() => ({
    company: users.filter((u) => u.isCompany).length,
    private: users.filter((u) => !u.isCompany).length,
  }), [users])

  const byMonth = useMemo(() => {
    const map = new Map<string, number>()
    users.forEach((u) => {
      const d = new Date(u.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      map.set(key, (map.get(key) || 0) + 1)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6)
  }, [users])

  const chartDataByRole = useMemo(() => [
    { name: 'Admin', count: byRole.admin, fill: '#a855f7' },
    { name: 'Používateľ', count: byRole.user, fill: '#3b82f6' },
  ].map((d) => ({ ...d, percent: users.length > 0 ? ((d.count / users.length) * 100).toFixed(1) : '0' })), [byRole, users.length])

  const byGender = useMemo(() => ({
    male: users.filter((u) => u.gender === Gender.MALE).length,
    female: users.filter((u) => u.gender === Gender.FEMALE).length,
    other: users.filter((u) => u.gender === Gender.OTHER).length,
    unspecified: users.filter((u) => !u.gender).length,
  }), [users])

  const chartDataByStatus = useMemo(() => {
    const total = byStatus.active + byStatus.banned
    return [
      { name: 'Aktívni', count: byStatus.active, fill: '#22c55e' },
      { name: 'Zablokovaní', count: byStatus.banned, fill: '#ef4444' },
    ].map((d) => ({ ...d, percent: total > 0 ? ((d.count / total) * 100).toFixed(1) : '0' }))
  }, [byStatus])

  const chartDataByGender = useMemo(() => [
    { name: 'Muž', count: byGender.male, fill: '#3b82f6' },
    { name: 'Žena', count: byGender.female, fill: '#ec4899' },
    { name: 'Iné', count: byGender.other, fill: '#8b5cf6' },
    { name: 'Nešpecifikované', count: byGender.unspecified, fill: '#6b7280' },
  ].filter((d) => d.count > 0), [byGender])

  const usersWithAge = useMemo(() => users.filter((u) => getAge(u.dateOfBirth) != null), [users])
  const avgAge = useMemo(() => {
    if (usersWithAge.length === 0) return null
    const sum = usersWithAge.reduce((acc, u) => acc + (getAge(u.dateOfBirth) ?? 0), 0)
    return Math.round((sum / usersWithAge.length) * 10) / 10
  }, [usersWithAge])

  const avgAgeByGender = useMemo(() => {
    const male = users.filter((u) => u.gender === Gender.MALE)
    const female = users.filter((u) => u.gender === Gender.FEMALE)
    const other = users.filter((u) => u.gender === Gender.OTHER)
    const unspecified = users.filter((u) => !u.gender)
    const calcAvg = (list: User[]) => {
      const withAge = list.filter((u) => getAge(u.dateOfBirth) != null)
      if (withAge.length === 0) return null
      const sum = withAge.reduce((acc, u) => acc + (getAge(u.dateOfBirth) ?? 0), 0)
      return Math.round((sum / withAge.length) * 10) / 10
    }
    return [
      { name: 'Muž', avgAge: calcAvg(male), count: male.length, fill: '#3b82f6' },
      { name: 'Žena', avgAge: calcAvg(female), count: female.length, fill: '#ec4899' },
      { name: 'Iné', avgAge: calcAvg(other), count: other.length, fill: '#8b5cf6' },
      { name: 'Nešpecifikované', avgAge: calcAvg(unspecified), count: unspecified.length, fill: '#6b7280' },
    ].filter((d) => d.avgAge != null) as { name: string; avgAge: number; count: number; fill: string }[]
  }, [users])

  const chartDataByMonth = useMemo(() =>
    byMonth.map(([month, count]) => ({ month, count, fill: count > 0 ? '#6366f1' : '#374151' })),
  [byMonth])

  return (
    <div className="min-h-screen bg-dark text-white flex">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-200">Používatelia</h1>
            <p className="text-sm text-gray-400 mt-1">Prehľad používateľov a štatistiky.</p>
          </div>

          {/* KPI karty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <span className="text-xs text-gray-400">Celkom používateľov</span>
                  <div className="text-2xl font-bold text-gray-200">{users.length}</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <UserCheck className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <span className="text-xs text-gray-400">Aktívni</span>
                  <div className="text-2xl font-bold text-gray-200">{byStatus.active}</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <UserX className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <span className="text-xs text-gray-400">Zablokovaní</span>
                  <div className="text-2xl font-bold text-gray-200">{byStatus.banned}</div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <UserCog className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <span className="text-xs text-gray-400">Admini / Používatelia</span>
                  <div className="text-xl font-bold text-gray-200">{byRole.admin} / {byRole.user}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grafy */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-card rounded-lg border border-dark overflow-hidden">
              <div className="p-4 border-b border-dark">
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide text-gray-400">Rozloženie podľa role</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-dark/40 border border-dark/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-300">Admin</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-200 tabular-nums">{byRole.admin}</div>
                  <div className="text-xs text-gray-500 mt-0.5">používateľov</div>
                  {users.length > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-dark overflow-hidden">
                      <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${(byRole.admin / users.length) * 100}%` }} />
                    </div>
                  )}
                </div>
                <div className="rounded-lg bg-dark/40 border border-dark/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-sm font-medium text-gray-300">Používateľ</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-200 tabular-nums">{byRole.user}</div>
                  <div className="text-xs text-gray-500 mt-0.5">používateľov</div>
                  {users.length > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-dark overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${(byRole.user / users.length) * 100}%` }} />
                    </div>
                  )}
                </div>
              </div>
              <div className="px-4 pb-4 pt-0">
                <div className="pt-1">
                  <p className="text-xs text-gray-500 mb-2">Graf podľa role</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <BarChart
                      data={[
                        { name: 'Admin', count: byRole.admin, fill: '#a855f7' },
                        { name: 'Používateľ', count: byRole.user, fill: '#3b82f6' },
                      ]}
                      layout="vertical"
                      margin={{ top: 8, right: 36, left: 56, bottom: 8 }}
                      barCategoryGap={12}
                    >
                      <XAxis type="number" domain={[0, Math.max(byRole.admin, byRole.user, 1)]} hide />
                      <YAxis type="category" dataKey="name" width={52} tick={{ fill: '#9ca3af', fontSize: 13 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af' }} labelStyle={{ color: '#9ca3af' }} cursor={false} formatter={(value: number) => [value, '']} />
                      <Bar dataKey="count" nameKey="name" radius={[0, 6, 6, 0]} barSize={28} minPointSize={4}>
                        {[
                          { name: 'Admin', count: byRole.admin, fill: '#a855f7' },
                          { name: 'Používateľ', count: byRole.user, fill: '#3b82f6' },
                        ].map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <h3 className="text-lg font-semibold text-gray-200 mb-1">Podľa statusu</h3>
              <p className="text-xs text-gray-500 mb-4">Aktívni vs. zablokovaní.</p>
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
                    <Tooltip contentStyle={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af' }} labelStyle={{ color: '#9ca3af' }} cursor={false} formatter={(value: number, name: string, props: { payload: { percent: string } }) => [`${value} (${props.payload.percent}%)`, name]} />
                    <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '12px' }} formatter={(value) => <span className="text-gray-300">{value}</span>} />
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
            {chartDataByMonth.length > 0 && (
              <div className="bg-card rounded-lg p-6 border border-dark">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">Registrácie za mesiace</h3>
                <p className="text-xs text-gray-500 mb-2">Posledných 6 mesiacov.</p>
                <div className="pt-1">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartDataByMonth} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: '11px' }} tick={{ fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af' }} labelStyle={{ color: '#9ca3af' }} cursor={false} />
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
            <div className="bg-card rounded-lg border border-dark overflow-hidden">
              <div className="p-4 border-b border-dark">
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide text-gray-400">Typ účtu</h3>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-dark/40 border border-dark/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-gray-300">Spoločnosti</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-200 tabular-nums">{byAccountType.company}</div>
                  <div className="text-xs text-gray-500 mt-0.5">používateľov</div>
                  {users.length > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-dark overflow-hidden">
                      <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${(byAccountType.company / users.length) * 100}%` }} />
                    </div>
                  )}
                </div>
                <div className="rounded-lg bg-dark/40 border border-dark/80 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-gray-300">Súkromné osoby</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-200 tabular-nums">{byAccountType.private}</div>
                  <div className="text-xs text-gray-500 mt-0.5">používateľov</div>
                  {users.length > 0 && (
                    <div className="mt-2 h-1.5 rounded-full bg-dark overflow-hidden">
                      <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${(byAccountType.private / users.length) * 100}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <h3 className="text-lg font-semibold text-gray-200 mb-1">Pohlavie</h3>
              <p className="text-xs text-gray-500 mb-4">Muž / Žena / Iné (iba osoby s vyplneným pohlavím).</p>
              {chartDataByGender.length > 0 ? (
                <>
                  <div className="flex items-center justify-center" style={{ minHeight: 180 }}>
                    <ResponsiveContainer width="100%" height={180}>
                      <RechartsPieChart>
                        <Pie
                          data={chartDataByGender}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={68}
                          paddingAngle={2}
                          stroke="transparent"
                        >
                          {chartDataByGender.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} stroke="#1f2937" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af' }} labelStyle={{ color: '#9ca3af' }} cursor={false} />
                        <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px' }} formatter={(value) => <span className="text-gray-300">{value}</span>} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 pt-4 border-t border-dark overflow-hidden">
                    <table className="w-full text-sm">
                      <tbody>
                        {chartDataByGender.map((d) => (
                          <tr key={d.name} className="border-b border-dark/50 last:border-0">
                            <td className="py-1.5 px-3 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                              <span className="text-gray-200">{d.name}</span>
                            </td>
                            <td className="py-1.5 px-3 text-right text-gray-200 font-medium">{d.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500 py-4">Žiadne dáta o pohlaví.</p>
              )}
            </div>
            <div className="bg-card rounded-lg p-6 border border-dark">
              <h3 className="text-lg font-semibold text-gray-200 mb-1">Priemerný vek</h3>
              <p className="text-xs text-gray-500 mb-4">Celkový priemer a podľa pohlavia (iba používatelia s dátumom narodenia).</p>
              {avgAge != null ? (
                <>
                  <div className="mb-4 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-gray-200 tabular-nums">{avgAge}</span>
                    <span className="text-gray-400 text-sm">rokov</span>
                  </div>
                  {avgAgeByGender.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-gray-500 mb-2">Priemer veku podľa pohlavia</p>
                      <ResponsiveContainer width="100%" height={Math.max(120, avgAgeByGender.length * 44)}>
                        <BarChart
                          data={avgAgeByGender}
                          layout="vertical"
                          margin={{ top: 8, right: 72, left: 64, bottom: 8 }}
                          barCategoryGap={12}
                        >
                          <XAxis type="number" domain={[0, 'auto']} hide />
                          <YAxis type="category" dataKey="name" width={58} tick={{ fill: '#d1d5db', fontSize: 13 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: 'transparent', border: 'none', color: '#9ca3af' }} labelStyle={{ color: '#9ca3af' }} cursor={false} formatter={(value: number) => [`${value} rokov`, 'Priem. vek']} />
                          <Bar dataKey="avgAge" nameKey="name" radius={[0, 4, 4, 0]} barSize={24} minPointSize={4}>
                            {avgAgeByGender.map((entry, index) => (
                              <Cell key={index} fill={entry.fill} />
                            ))}
                            <LabelList dataKey="avgAge" position="right" fill="#d1d5db" fontSize={13} fontWeight={600} formatter={(v: number) => `${v} rokov`} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                      <table className="w-full text-sm mt-4 border-t border-dark pt-3">
                        <thead>
                          <tr className="text-left text-gray-400 border-b border-dark/50">
                            <th className="py-2 px-0 font-medium">Pohlavie</th>
                            <th className="py-2 px-0 font-medium text-right">Priem. vek</th>
                          </tr>
                        </thead>
                        <tbody>
                          {avgAgeByGender.map((d) => (
                            <tr key={d.name} className="border-b border-dark/50 last:border-0">
                              <td className="py-2 px-0 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                                <span className="text-gray-200">{d.name}</span>
                              </td>
                              <td className="py-2 px-0 text-right text-gray-200 font-semibold tabular-nums">{d.avgAge} rokov</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 py-4">Žiadne dáta o veku (žiadny používateľ nemá vyplnený dátum narodenia).</p>
              )}
            </div>
          </div>

          {/* Filtre */}
          <div className="bg-card rounded-lg p-4 border border-dark mb-6">
            <div className="flex items-center space-x-2 mb-4">
              <FilterIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-300">Filtre</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <div>
                <label className="block text-xs text-gray-400 mb-2">Pohlavie</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value as '' | Gender })}
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                >
                  <option value="">Všetky</option>
                  <option value={Gender.MALE}>Muž</option>
                  <option value={Gender.FEMALE}>Žena</option>
                  <option value={Gender.OTHER}>Iné</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Vek od</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  placeholder="napr. 18"
                  value={filters.minAge}
                  onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Vek do</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  placeholder="napr. 65"
                  value={filters.maxAge}
                  onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                  className="w-full bg-dark border border-card rounded-lg px-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gray-600 hover:bg-cardHover"
                />
              </div>
            </div>
            {(filters.search || filters.role || filters.status || filters.accountType || filters.gender || filters.minAge || filters.maxAge) && (
              <div className="mt-4 flex items-center justify-end">
                <button
                  onClick={() => setFilters({ search: '', role: '', status: '', accountType: '', gender: '', minAge: '', maxAge: '' })}
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
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Typ</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Pohlavie</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Vek</th>
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
                            <span className={`px-2 py-1 rounded text-xs font-medium ${user.isCompany ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                              {getAccountTypeLabel(user.isCompany)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300 text-sm">
                            {getGenderLabel(user.gender)}
                          </td>
                          <td className="px-6 py-4 text-gray-300 text-sm tabular-nums">
                            {getAge(user.dateOfBirth) != null ? `${getAge(user.dateOfBirth)} rokov` : '-'}
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
                                  onClick={() => handleUnbanClick(user)}
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
                        <label className="text-sm text-gray-400">Typ účtu</label>
                        <p className="text-white">{getAccountTypeLabel(selectedUser.isCompany)}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Pohlavie</label>
                        <p className="text-white">{getGenderLabel(selectedUser.gender)}</p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-400">Vek</label>
                        <p className="text-white">
                          {getAge(selectedUser.dateOfBirth) != null ? `${getAge(selectedUser.dateOfBirth)} rokov` : '-'}
                        </p>
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
                          handleUnbanClick(selectedUser)
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

          <ConfirmDialog
            open={!!unblockConfirmUser}
            title="Odblokovať používateľa"
            message={
              unblockConfirmUser
                ? `Naozaj chcete odblokovať používateľa ${unblockConfirmUser.email}?`
                : ''
            }
            confirmLabel="Odblokovať"
            cancelLabel="Zrušiť"
            variant="success"
            onConfirm={handleUnbanConfirm}
            onCancel={() => setUnblockConfirmUser(null)}
          />

          <AlertDialog
            open={!!alertMessage}
            title={alertMessage?.title ?? ''}
            message={alertMessage?.message ?? ''}
            onClose={() => setAlertMessage(null)}
          />
        </main>
      </div>
    </div>
  )
}
