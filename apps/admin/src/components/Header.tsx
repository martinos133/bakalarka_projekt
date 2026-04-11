'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Bell, LogOut, ChevronDown, MessageCircle, Send, ArrowRight, X, Clock, Flag, FileText, AlertTriangle } from 'lucide-react'
import { getAuthUser, logout, setAuthUser } from '@/lib/auth'
import api from '@/lib/api'

interface NotifItem {
  id: string
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  title: string
  description: string
  path: string
  count: number
}

const shortcuts = [
  { label: 'Inzeráty', path: '/dashboard/advertisements' },
  { label: 'Používatelia', path: '/dashboard/users' },
  { label: 'Moderácia', path: '/dashboard/pending' },
  { label: 'Nastavenia', path: '/dashboard/settings' },
]

interface Partner {
  id: string
  email: string
  firstName?: string
  lastName?: string
  lastLoginAt?: string
}

interface Conversation {
  id: string
  partner: Partner
  lastMessage: {
    content: string
    senderId: string
    createdAt: string
    read: boolean
  } | null
  createdAt: string
}

function getName(p: Partner) {
  if (p.firstName || p.lastName) return `${p.firstName || ''} ${p.lastName || ''}`.trim()
  return p.email
}

function getInitials(p: Partner) {
  const f = p.firstName?.charAt(0) || ''
  const l = p.lastName?.charAt(0) || ''
  return (f + l).toUpperCase() || p.email.charAt(0).toUpperCase()
}

function isOnline(lastLoginAt?: string | null) {
  if (!lastLoginAt) return false
  return Date.now() - new Date(lastLoginAt).getTime() < 5 * 60 * 1000
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'teraz'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hod`
  return `${Math.floor(hours / 24)} d`
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [notifsOpen, setNotifsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotifItem[]>([])
  const [notifsTotal, setNotifsTotal] = useState(0)
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [unreadTotal, setUnreadTotal] = useState(0)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  const notifsRef = useRef<HTMLDivElement>(null)
  const replyInputRef = useRef<HTMLInputElement>(null)

  const pageTitle = getPageTitle(pathname)

  useEffect(() => {
    const sync = () => setUser(getAuthUser())
    sync()
    window.addEventListener('admin-auth-sync', sync)
    return () => window.removeEventListener('admin-auth-sync', sync)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await api.getAuthMe()
        if (cancelled || !me || typeof me !== 'object') return
        const cur = getAuthUser()
        if (!cur) return
        setAuthUser({
          avatarUrl: (me as { avatarUrl?: string | null }).avatarUrl ?? cur.avatarUrl ?? null,
          firstName: (me as { firstName?: string }).firstName ?? cur.firstName,
          lastName: (me as { lastName?: string }).lastName ?? cur.lastName,
        })
        setUser(getAuthUser())
      } catch {
        /* ticho */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadChatData = useCallback(async () => {
    try {
      const [convs, unread] = await Promise.all([
        api.getChatConversations(),
        api.getChatUnread(),
      ])
      setConversations(convs)
      setUnreadTotal(unread.total || 0)
      setUnreadCounts(unread.counts || {})
    } catch {}
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      const items: NotifItem[] = []

      const [pendingAds, pendingReports, chatUnread, adminMsgs, auditStats] = await Promise.all([
        api.getPendingAdvertisements().catch(() => []),
        api.getPendingReports().catch(() => []),
        api.getChatUnread().catch(() => ({ total: 0 })),
        api.getAdminMessages('unread').catch(() => []),
        api.getAuditStats().catch(() => null),
      ])

      const pendingCount = Array.isArray(pendingAds) ? pendingAds.length : 0
      if (pendingCount > 0) {
        items.push({
          id: 'pending-ads',
          icon: Clock,
          iconBg: 'bg-amber-500/10',
          iconColor: 'text-amber-400',
          title: 'Čakajúce inzeráty',
          description: `${pendingCount} ${pendingCount === 1 ? 'inzerát čaká' : pendingCount < 5 ? 'inzeráty čakajú' : 'inzerátov čaká'} na schválenie`,
          path: '/dashboard/advertisements?status=pending',
          count: pendingCount,
        })
      }

      const reportsCount = Array.isArray(pendingReports) ? pendingReports.length : 0
      if (reportsCount > 0) {
        items.push({
          id: 'pending-reports',
          icon: Flag,
          iconBg: 'bg-red-500/10',
          iconColor: 'text-red-400',
          title: 'Nahlásenia',
          description: `${reportsCount} ${reportsCount === 1 ? 'nahlásenie čaká' : reportsCount < 5 ? 'nahlásenia čakajú' : 'nahlásení čaká'} na riešenie`,
          path: '/dashboard/reports',
          count: reportsCount,
        })
      }

      const chatCount = chatUnread?.total || 0
      if (chatCount > 0) {
        items.push({
          id: 'unread-chat',
          icon: MessageCircle,
          iconBg: 'bg-blue-500/10',
          iconColor: 'text-blue-400',
          title: 'Neprečítané správy',
          description: `${chatCount} ${chatCount === 1 ? 'neprečítaná správa' : chatCount < 5 ? 'neprečítané správy' : 'neprečítaných správ'}`,
          path: '/dashboard/team-chat',
          count: chatCount,
        })
      }

      const msgsCount = Array.isArray(adminMsgs) ? adminMsgs.length : 0
      if (msgsCount > 0) {
        items.push({
          id: 'admin-msgs',
          icon: FileText,
          iconBg: 'bg-purple-500/10',
          iconColor: 'text-purple-400',
          title: 'Správy od používateľov',
          description: `${msgsCount} ${msgsCount === 1 ? 'neprečítaná správa' : msgsCount < 5 ? 'neprečítané správy' : 'neprečítaných správ'}`,
          path: '/dashboard/messages',
          count: msgsCount,
        })
      }

      const errorsToday = auditStats?.today?.errors || 0
      if (errorsToday > 0) {
        items.push({
          id: 'audit-errors',
          icon: AlertTriangle,
          iconBg: 'bg-orange-500/10',
          iconColor: 'text-orange-400',
          title: 'Systémové chyby',
          description: `${errorsToday} ${errorsToday === 1 ? 'chyba dnes' : errorsToday < 5 ? 'chyby dnes' : 'chýb dnes'}`,
          path: '/dashboard/audit',
          count: errorsToday,
        })
      }

      setNotifications(items)
      setNotifsTotal(items.reduce((s, i) => s + i.count, 0))
    } catch {}
  }, [])

  useEffect(() => {
    loadChatData()
    loadNotifications()
    const chatInterval = setInterval(loadChatData, 8000)
    const notifInterval = setInterval(loadNotifications, 15000)
    return () => {
      clearInterval(chatInterval)
      clearInterval(notifInterval)
    }
  }, [loadChatData, loadNotifications])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (chatOpen && chatRef.current && !chatRef.current.contains(e.target as Node)) {
        setChatOpen(false)
        setReplyTo(null)
      }
      if (notifsOpen && notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setNotifsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [userMenuOpen, chatOpen, notifsOpen])

  useEffect(() => {
    if (replyTo && replyInputRef.current) {
      replyInputRef.current.focus()
    }
  }, [replyTo])

  const handleQuickReply = async (convId: string) => {
    if (!replyText.trim() || sendingReply) return
    setSendingReply(true)
    try {
      await api.sendChatMessage(convId, replyText.trim())
      setReplyText('')
      setReplyTo(null)
      loadChatData()
    } catch {}
    setSendingReply(false)
  }

  const initials =
    ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() ||
    (user?.email?.[0] || 'A').toUpperCase()

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-dark">
      <div className="flex items-center justify-between px-8 h-16">
        <h1 className="text-lg font-semibold text-white">{pageTitle}</h1>

        <div className="flex items-center gap-3">
          {/* Shortcuts */}
          <nav className="hidden lg:flex items-center gap-1 mr-2">
            {shortcuts.map((s) => (
              <button
                key={s.path}
                onClick={() => router.push(s.path)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${pathname === s.path
                    ? 'bg-popupRowActive text-accent'
                    : 'text-gray-400 hover:text-white hover:bg-popupHover'
                  }
                `}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="hidden h-5 w-px bg-dark-200 lg:block" />

          {/* Search */}
          <div className={`relative transition-all duration-200 ${searchFocused ? 'w-64' : 'w-48'}`}>
            <input
              type="text"
              placeholder="Hľadať..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ paddingLeft: '2.25rem' }}
              className="w-full rounded-xl border border-white/10 bg-dark-50 pr-4 py-2 text-sm text-white transition-all focus:border-accent/40 focus:outline-none focus:bg-dark-100"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
          </div>

          {/* Chat widget */}
          <div ref={chatRef} className="relative">
            <button
              onClick={() => { setChatOpen((v) => !v); setReplyTo(null) }}
              className={`relative rounded-xl p-2 transition-colors ${
                chatOpen ? 'bg-popupRowActive text-accent' : 'text-gray-400 hover:bg-popupHover hover:text-white'
              }`}
              aria-label={unreadTotal > 0 ? `Správy, ${unreadTotal} neprečítaných` : 'Správy'}
            >
              {/* Wrapper keeps the bubble icon fully visible; badge sits outside the icon bounds */}
              <span className="relative inline-flex h-[22px] w-[22px] items-center justify-center">
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2} />
                {unreadTotal > 0 && (
                  <>
                    <span
                      className="pointer-events-none absolute -right-2 -top-1.5 h-4 min-w-4 rounded-full bg-red-500 animate-ping opacity-35"
                      aria-hidden
                    />
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold leading-none text-white shadow-md shadow-red-500/40 ring-2 ring-dark">
                      {unreadTotal > 9 ? '9+' : unreadTotal}
                    </span>
                  </>
                )}
              </span>
            </button>

            {chatOpen && (
              <div
                className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-popup shadow-xl shadow-black/50"
                style={{ animation: 'slideDown 0.15s ease-out', backgroundColor: 'var(--popup-surface)' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <div>
                    <p className="text-sm font-semibold text-white">Správy</p>
                    {unreadTotal > 0 && (
                      <p className="text-[11px] text-accent">{unreadTotal} neprečítaných</p>
                    )}
                  </div>
                  <button
                    onClick={() => { setChatOpen(false); router.push('/dashboard/team-chat') }}
                    className="flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors"
                  >
                    Otvoriť chat
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Conversation list */}
                <div className="max-h-[380px] overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="py-10 text-center">
                      <MessageCircle className="w-8 h-8 text-white/10 mx-auto mb-2" />
                      <p className="text-xs text-white/25">Žiadne konverzácie</p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const online = isOnline(conv.partner.lastLoginAt)
                      const unread = unreadCounts[conv.id] || 0
                      const isReplying = replyTo === conv.id

                      return (
                        <div key={conv.id} className="border-b border-white/[0.04] last:border-0">
                          <button
                            onClick={() => {
                              if (replyTo === conv.id) {
                                setReplyTo(null)
                              } else {
                                setReplyTo(conv.id)
                                setReplyText('')
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                              isReplying ? 'bg-popupRowHover' : 'hover:bg-popupRowHover'
                            }`}
                          >
                            <div className="relative flex-shrink-0">
                              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
                                unread > 0 ? 'bg-popupRowActive text-accent' : 'bg-dark-200 text-white/50'
                              }`}>
                                {getInitials(conv.partner)}
                              </div>
                              {online && (
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-[1.5px] border-[rgb(28,28,28)]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm truncate ${unread > 0 ? 'font-semibold text-white' : 'text-white/70'}`}>
                                  {getName(conv.partner)}
                                </span>
                                {conv.lastMessage && (
                                  <span className="text-[10px] text-muted ml-2 flex-shrink-0">
                                    {timeAgo(conv.lastMessage.createdAt)}
                                  </span>
                                )}
                              </div>
                              {conv.lastMessage && (
                                <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'text-white/60 font-medium' : 'text-white/30'}`}>
                                  {conv.lastMessage.senderId === user?.id ? 'Vy: ' : ''}
                                  {conv.lastMessage.content || '📎 Príloha'}
                                </p>
                              )}
                            </div>
                            {unread > 0 && (
                              <span className="min-w-[18px] h-[18px] rounded-full bg-accent text-dark text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0">
                                {unread}
                              </span>
                            )}
                          </button>

                          {/* Quick reply */}
                          {isReplying && (
                            <div className="px-4 pb-3 flex gap-2">
                              <input
                                ref={replyInputRef}
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleQuickReply(conv.id)
                                  if (e.key === 'Escape') { setReplyTo(null); setReplyText('') }
                                }}
                                placeholder="Rýchla odpoveď..."
                                className="flex-1 text-xs py-1.5 px-3 !rounded-xl"
                                style={{ paddingLeft: '0.75rem' }}
                              />
                              <button
                                onClick={() => handleQuickReply(conv.id)}
                                disabled={!replyText.trim() || sendingReply}
                                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all ${
                                  replyText.trim() ? 'bg-accent text-dark' : 'bg-popupHover text-white/20'
                                }`}
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-white/[0.06]">
                  <button
                    onClick={() => { setChatOpen(false); router.push('/dashboard/team-chat') }}
                    className="w-full text-center text-xs text-accent hover:text-accent-light transition-colors py-1"
                  >
                    Zobraziť všetky správy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notifsRef} className="relative">
            <button
              onClick={() => { setNotifsOpen(!notifsOpen); if (!notifsOpen) loadNotifications() }}
              className="relative rounded-xl p-2 text-gray-400 transition-colors hover:bg-popupHover hover:text-white"
            >
              <Bell className="w-[18px] h-[18px]" />
              {notifsTotal > 0 && (
                <>
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 animate-ping opacity-30" />
                  <span className="absolute top-1 right-1 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-lg shadow-red-500/40">
                    {notifsTotal > 99 ? '99+' : notifsTotal}
                  </span>
                </>
              )}
            </button>

            {notifsOpen && (
              <div
                className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-2xl border border-white/10 bg-popup shadow-2xl"
                style={{ backgroundColor: 'var(--popup-surface)' }}
              >
                <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Notifikácie</h3>
                    {notifsTotal > 0 && (
                      <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                        {notifsTotal}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setNotifsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Žiadne nové notifikácie</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const Icon = notif.icon
                      return (
                        <button
                          key={notif.id}
                          onClick={() => { setNotifsOpen(false); router.push(notif.path) }}
                          className="flex w-full items-center gap-3 border-b border-white/[0.06] px-4 py-3 text-left transition-colors last:border-0 hover:bg-popupRowHover"
                        >
                          <div className={`w-9 h-9 rounded-xl ${notif.iconBg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`w-4.5 h-4.5 ${notif.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{notif.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{notif.description}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#3d2224] px-1.5 text-[11px] font-bold text-red-400">
                              {notif.count}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-center">
                    <p className="text-[11px] text-gray-500">
                      Kliknutím prejdete na detail
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div ref={userMenuRef} className="relative ml-1">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className={`
                flex items-center gap-3 rounded-2xl py-1.5 pl-2 pr-3 transition-colors
                ${userMenuOpen ? 'bg-popupHover' : 'hover:bg-popupHover'}
              `}
            >
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-9 w-9 flex-shrink-0 rounded-full border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-popupRowActive text-xs font-semibold text-accent">
                  {initials}
                </div>
              )}
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-white leading-tight">
                  {user?.firstName || 'Admin'} {user?.lastName || 'User'}
                </p>
                <p className="text-[11px] text-muted leading-tight">Administrátor</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/35 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-popup shadow-xl shadow-black/40"
                style={{ backgroundColor: 'var(--popup-surface)' }}
              >
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.firstName || 'Admin'} {user?.lastName || 'User'}
                  </p>
                  <p className="text-xs text-muted truncate">{user?.email || ''}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    logout()
                    router.push('/login')
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-300 transition-colors hover:bg-popupRowHover hover:text-white"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  Odhlásiť sa
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function getPageTitle(pathname: string): string {
  const map: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/dashboard/advertisements': 'Inzeráty',
    '/dashboard/users': 'Používatelia',
    '/dashboard/categories': 'Kategórie',
    '/dashboard/specifications': 'Špecifikácie',
    '/dashboard/monitoring': 'Monitoring kliknutí',
    '/dashboard/contact-forms': 'Kontaktné formuláre',
    '/dashboard/pending': 'Čakajúce inzeráty',
    '/dashboard/reported': 'Nahlásené inzeráty',
    '/dashboard/settings': 'Nastavenia',
    '/dashboard/team-chat': 'Tímový chat',
    '/dashboard/staff': 'Tím',
    '/dashboard/audit': 'Audit & Logy',
    '/dashboard/seo': 'SEO prehľad',
    '/dashboard/moj-profil': 'Môj účet',
    '/dashboard/organizer': 'Organizér',
    '/dashboard/dev/static-pages': 'Statické stránky',
    '/dashboard/dev/blog': 'Blog',
    '/dashboard/dev/categories': 'Kategórie (DEV)',
    '/dashboard/dev/advertisements': 'Inzeráty (DEV)',
    '/dashboard/dev/menu': 'Menu',
    '/dashboard/dev/components': 'Komponenty',
    '/dashboard/dev/config': 'Konfigurácia',
    '/dashboard/dev/filters': 'Filtre',
  }
  return map[pathname] || 'Admin Panel'
}
