'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, isOwnerAdmin } from '@/lib/auth'
import { api } from '@/lib/api'
import DashboardLayout from '@/components/DashboardLayout'
import {
  Plus,
  X,
  Shield,
  ShieldCheck,
  UserCog,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react'

interface StaffMember {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  role: string
  adminPermissions?: string[] | null
  banned: boolean
  lastLoginAt?: string | null
  createdAt: string
}

const PERMISSION_GROUPS: { title: string; permissions: { key: string; label: string }[] }[] = [
  {
    title: 'Nástenky',
    permissions: [
      { key: 'dashboard', label: 'Dashboard' },
      { key: 'organizer', label: 'Organizér' },
      { key: 'advertisements', label: 'Inzeráty' },
      { key: 'users', label: 'Používatelia' },
      { key: 'categories', label: 'Kategórie' },
      { key: 'specifications', label: 'Špecifikácie' },
      { key: 'monitoring', label: 'Monitoring' },
    ],
  },
  {
    title: 'Komunikácia',
    permissions: [
      { key: 'contact_forms', label: 'Kontaktné formuláre' },
    ],
  },
  {
    title: 'Moderácia',
    permissions: [
      { key: 'pending', label: 'Čakajúce inzeráty' },
      { key: 'reported', label: 'Nahlásené inzeráty' },
    ],
  },
  {
    title: 'Správa',
    permissions: [
      { key: 'staff', label: 'Správa tímu' },
    ],
  },
  {
    title: 'Obsah',
    permissions: [
      { key: 'static_pages', label: 'Statické stránky' },
      { key: 'blog', label: 'Blog' },
    ],
  },
  {
    title: 'Development',
    permissions: [
      { key: 'dev_categories', label: 'Dev kategórie' },
      { key: 'dev_advertisements', label: 'Dev inzeráty' },
      { key: 'dev_menu', label: 'Dev menu' },
      { key: 'dev_components', label: 'Dev komponenty' },
      { key: 'dev_config', label: 'Dev konfigurácia' },
    ],
  },
  {
    title: 'Ostatné',
    permissions: [
      { key: 'settings', label: 'Nastavenia' },
    ],
  },
]

const ALL_PERM_KEYS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key))

export default function StaffPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPermsModal, setShowPermsModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null)

  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    permissions: [] as string[],
  })
  const [editPerms, setEditPerms] = useState<string[]>([])
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [now, setNow] = useState(Date.now())

  const owner = isOwnerAdmin()

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const loadStaff = useCallback(async () => {
    try {
      setError('')
      const data = await api.getStaff()
      setStaff(data)
    } catch (e: any) {
      setError(e.message || 'Nepodarilo sa načítať tím')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    loadStaff()
  }, [loadStaff, router])

  const handleCreate = async () => {
    if (!createForm.email || !createForm.password) return
    setSaving(true)
    try {
      await api.createStaffMember({
        email: createForm.email,
        password: createForm.password,
        firstName: createForm.firstName || undefined,
        lastName: createForm.lastName || undefined,
        permissions: createForm.permissions,
      })
      setShowCreateModal(false)
      setCreateForm({ email: '', password: '', firstName: '', lastName: '', permissions: [] })
      loadStaff()
    } catch (e: any) {
      setError(e.message || 'Nepodarilo sa vytvoriť účet')
    } finally {
      setSaving(false)
    }
  }

  const openPermsModal = (member: StaffMember) => {
    setSelectedMember(member)
    setEditPerms(Array.isArray(member.adminPermissions) ? [...member.adminPermissions] : [])
    setShowPermsModal(true)
  }

  const handleSavePerms = async () => {
    if (!selectedMember) return
    setSaving(true)
    try {
      await api.updateStaffPermissions(selectedMember.id, editPerms)
      setShowPermsModal(false)
      loadStaff()
    } catch (e: any) {
      setError(e.message || 'Nepodarilo sa uložiť oprávnenia')
    } finally {
      setSaving(false)
    }
  }

  const openPasswordModal = (member: StaffMember) => {
    setSelectedMember(member)
    setNewPassword('')
    setShowPassword(false)
    setShowPasswordModal(true)
  }

  const handleResetPassword = async () => {
    if (!selectedMember || !newPassword) return
    setSaving(true)
    try {
      await api.resetStaffPassword(selectedMember.id, newPassword)
      setShowPasswordModal(false)
      setNewPassword('')
    } catch (e: any) {
      setError(e.message || 'Nepodarilo sa zmeniť heslo')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (member: StaffMember) => {
    if (!confirm(`Naozaj chcete odstrániť ${member.firstName || member.email} z admin tímu?`)) return
    try {
      await api.removeStaffMember(member.id)
      loadStaff()
    } catch (e: any) {
      setError(e.message || 'Nepodarilo sa odstrániť člena')
    }
  }

  const togglePerm = (perms: string[], key: string) => {
    return perms.includes(key) ? perms.filter((p) => p !== key) : [...perms, key]
  }

  const toggleAllPerms = (perms: string[], keys: string[]) => {
    const allSelected = keys.every((k) => perms.includes(k))
    if (allSelected) {
      return perms.filter((p) => !keys.includes(p))
    }
    return [...new Set([...perms, ...keys])]
  }

  const isMemberOwner = (member: StaffMember) => {
    return !member.adminPermissions || !Array.isArray(member.adminPermissions) || member.adminPermissions.length === 0
  }

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Správa tímu</h1>
            <p className="text-muted text-sm mt-1">
              Vytvorte účty pre brigádnikov a nastavte im oprávnenia
            </p>
          </div>
          {owner && (
            <button
              onClick={() => {
                setCreateForm({ email: '', password: '', firstName: '', lastName: '', permissions: [] })
                setShowCreateModal(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-dark font-semibold rounded-xl hover:bg-accent-light transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Nový člen tímu
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {staff.map((member) => {
              const memberIsOwner = isMemberOwner(member)
              const permCount = Array.isArray(member.adminPermissions) ? member.adminPermissions.length : 0

              return (
                <div
                  key={member.id}
                  className="bg-card rounded-2xl border border-white/[0.06] p-5 flex items-center gap-5"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
                    {(member.firstName?.charAt(0) || '') + (member.lastName?.charAt(0) || '') || member.email.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {member.firstName || ''} {member.lastName || ''}
                      </h3>
                      {memberIsOwner ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">
                          <ShieldCheck className="w-3 h-3" />
                          Vlastník
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                          <Shield className="w-3 h-3" />
                          Člen tímu
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5 truncate">{member.email}</p>
                    {!memberIsOwner && (
                      <p className="text-xs text-white/30 mt-1">
                        {permCount} z {ALL_PERM_KEYS.length} oprávnení
                      </p>
                    )}
                  </div>

                  {/* Posledné prihlásenie / Online status */}
                  <div className="text-right flex-shrink-0 hidden md:block">
                    {(() => {
                      if (!member.lastLoginAt) {
                        return (
                          <>
                            <p className="text-[10px] text-muted uppercase tracking-wider">Posledné prihlásenie</p>
                            <p className="text-xs text-white/60 mt-0.5">—</p>
                          </>
                        )
                      }
                      const diff = now - new Date(member.lastLoginAt).getTime()
                      const isOnline = diff < 5 * 60 * 1000
                      if (isOnline) {
                        return (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                            </span>
                            <span className="text-xs font-semibold text-green-400">Online</span>
                          </div>
                        )
                      }
                      return (
                        <>
                          <p className="text-[10px] text-muted uppercase tracking-wider">Posledné prihlásenie</p>
                          <p className="text-xs text-white/60 mt-0.5">
                            {new Date(member.lastLoginAt).toLocaleDateString('sk-SK', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </>
                      )
                    })()}
                  </div>

                  {/* Actions */}
                  {owner && !memberIsOwner && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openPermsModal(member)}
                        className="p-2 rounded-xl text-white/40 hover:text-accent hover:bg-accent/10 transition-colors"
                        title="Oprávnenia"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openPasswordModal(member)}
                        className="p-2 rounded-xl text-white/40 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                        title="Zmeniť heslo"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemove(member)}
                        className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Odstrániť z tímu"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}

            {staff.length === 0 && (
              <div className="text-center py-16">
                <UserCog className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-muted text-sm">Zatiaľ žiadni členovia tímu</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative w-full max-w-2xl bg-card rounded-2xl border border-white/[0.08] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-lg font-semibold text-white">Nový člen tímu</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Meno</label>
                  <input
                    type="text"
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    placeholder="Ján"
                    className="w-full px-4 py-2.5 bg-dark-100 border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-accent/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Priezvisko</label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    placeholder="Novák"
                    className="w-full px-4 py-2.5 bg-dark-100 border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-accent/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="brigadnik@example.com"
                  className="w-full px-4 py-2.5 bg-dark-100 border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-accent/40"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">Heslo *</label>
                <input
                  type="text"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Heslo pre nového člena"
                  className="w-full px-4 py-2.5 bg-dark-100 border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-accent/40"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-medium text-muted">Oprávnenia</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, permissions: [...ALL_PERM_KEYS] })}
                      className="text-[10px] text-accent hover:underline"
                    >
                      Vybrať všetky
                    </button>
                    <span className="text-white/20">|</span>
                    <button
                      type="button"
                      onClick={() => setCreateForm({ ...createForm, permissions: [] })}
                      className="text-[10px] text-white/40 hover:underline"
                    >
                      Zrušiť všetky
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {PERMISSION_GROUPS.map((group) => (
                    <div key={group.title}>
                      <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">
                        {group.title}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {group.permissions.map((perm) => {
                          const active = createForm.permissions.includes(perm.key)
                          return (
                            <button
                              key={perm.key}
                              type="button"
                              onClick={() =>
                                setCreateForm({
                                  ...createForm,
                                  permissions: togglePerm(createForm.permissions, perm.key),
                                })
                              }
                              className={`
                                px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left flex items-center gap-2
                                ${active
                                  ? 'bg-accent/10 text-accent border border-accent/30'
                                  : 'bg-dark-100 text-white/50 border border-white/[0.06] hover:border-white/10'
                                }
                              `}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${active ? 'bg-accent text-dark' : 'border border-white/20'}`}>
                                {active && <Check className="w-3 h-3" />}
                              </div>
                              {perm.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
              <p className="text-xs text-white/30">
                {createForm.permissions.length} z {ALL_PERM_KEYS.length} oprávnení
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
                >
                  Zrušiť
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !createForm.email || !createForm.password}
                  className="px-5 py-2 bg-accent text-dark font-semibold rounded-xl hover:bg-accent-light transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />}
                  Vytvoriť účet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions modal */}
      {showPermsModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPermsModal(false)} />
          <div className="relative w-full max-w-2xl bg-card rounded-2xl border border-white/[0.08] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-semibold text-white">Oprávnenia</h3>
                <p className="text-xs text-muted mt-0.5">
                  {selectedMember.firstName || selectedMember.email}
                </p>
              </div>
              <button
                onClick={() => setShowPermsModal(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-end gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setEditPerms([...ALL_PERM_KEYS])}
                  className="text-[10px] text-accent hover:underline"
                >
                  Vybrať všetky
                </button>
                <span className="text-white/20">|</span>
                <button
                  type="button"
                  onClick={() => setEditPerms([])}
                  className="text-[10px] text-white/40 hover:underline"
                >
                  Zrušiť všetky
                </button>
              </div>

              <div className="space-y-4">
                {PERMISSION_GROUPS.map((group) => {
                  const groupKeys = group.permissions.map((p) => p.key)
                  const allGroupSelected = groupKeys.every((k) => editPerms.includes(k))

                  return (
                    <div key={group.title}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-wider">
                          {group.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setEditPerms(toggleAllPerms(editPerms, groupKeys))}
                          className={`text-[10px] ${allGroupSelected ? 'text-white/30' : 'text-accent'} hover:underline`}
                        >
                          {allGroupSelected ? 'zrušiť sekciu' : 'vybrať sekciu'}
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {group.permissions.map((perm) => {
                          const active = editPerms.includes(perm.key)
                          return (
                            <button
                              key={perm.key}
                              type="button"
                              onClick={() => setEditPerms(togglePerm(editPerms, perm.key))}
                              className={`
                                px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left flex items-center gap-2
                                ${active
                                  ? 'bg-accent/10 text-accent border border-accent/30'
                                  : 'bg-dark-100 text-white/50 border border-white/[0.06] hover:border-white/10'
                                }
                              `}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${active ? 'bg-accent text-dark' : 'border border-white/20'}`}>
                                {active && <Check className="w-3 h-3" />}
                              </div>
                              {perm.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
              <p className="text-xs text-white/30">
                {editPerms.length} z {ALL_PERM_KEYS.length} oprávnení
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPermsModal(false)}
                  className="px-4 py-2 text-sm rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
                >
                  Zrušiť
                </button>
                <button
                  onClick={handleSavePerms}
                  disabled={saving}
                  className="px-5 py-2 bg-accent text-dark font-semibold rounded-xl hover:bg-accent-light transition-colors text-sm disabled:opacity-40 flex items-center gap-2"
                >
                  {saving && <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />}
                  Uložiť oprávnenia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password modal */}
      {showPasswordModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative w-full max-w-md bg-card rounded-2xl border border-white/[0.08] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <div>
                <h3 className="text-lg font-semibold text-white">Zmeniť heslo</h3>
                <p className="text-xs text-muted mt-0.5">
                  {selectedMember.firstName || selectedMember.email}
                </p>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <label className="block text-xs font-medium text-muted mb-1.5">Nové heslo</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Zadajte nové heslo"
                  className="w-full px-4 py-2.5 pr-12 bg-dark-100 border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-accent/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-sm rounded-xl border border-white/10 text-white/60 hover:bg-white/5 transition-colors"
              >
                Zrušiť
              </button>
              <button
                onClick={handleResetPassword}
                disabled={saving || !newPassword}
                className="px-5 py-2 bg-accent text-dark font-semibold rounded-xl hover:bg-accent-light transition-colors text-sm disabled:opacity-40 flex items-center gap-2"
              >
                {saving && <div className="w-4 h-4 border-2 border-dark/30 border-t-dark rounded-full animate-spin" />}
                Zmeniť heslo
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
