'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search, Bell, LogOut, ChevronDown, MessageCircle, Send, ArrowRight, X } from 'lucide-react'
import { getAuthUser, logout } from '@/lib/auth'
import api from '@/lib/api'

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
  const replyInputRef = useRef<HTMLInputElement>(null)

  const pageTitle = getPageTitle(pathname)

  useEffect(() => {
    setUser(getAuthUser())
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

  useEffect(() => {
    loadChatData()
    const interval = setInterval(loadChatData, 8000)
    return () => clearInterval(interval)
  }, [loadChatData])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (chatOpen && chatRef.current && !chatRef.current.contains(e.target as Node)) {
        setChatOpen(false)
        setReplyTo(null)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [userMenuOpen, chatOpen])

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
    <header className="sticky top-0 z-30 bg-dark/80 backdrop-blur-xl border-b border-white/[0.06]">
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
                    ? 'bg-accent/10 text-accent'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
                  }
                `}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="h-5 w-px bg-white/[0.08] hidden lg:block" />

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
              className="w-full bg-white/[0.08] border border-white/[0.10] rounded-xl pr-4 py-2 text-sm text-white transition-all focus:outline-none focus:border-accent/40 focus:bg-white/[0.12]"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
          </div>

          {/* Chat widget */}
          <div ref={chatRef} className="relative">
            <button
              onClick={() => { setChatOpen((v) => !v); setReplyTo(null) }}
              className={`relative p-2 rounded-xl transition-colors ${
                chatOpen ? 'bg-accent/10 text-accent' : 'text-gray-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              {unreadTotal > 0 && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-accent animate-ping opacity-40" />
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-accent text-dark text-[10px] font-bold flex items-center justify-center px-1 shadow-lg shadow-accent/30">
                    {unreadTotal > 9 ? '9+' : unreadTotal}
                  </span>
                </>
              )}
            </button>

            {chatOpen && (
              <div
                className="absolute right-0 mt-2 w-[360px] bg-[rgb(28,28,28)] border border-white/[0.08] rounded-2xl shadow-xl shadow-black/50 overflow-hidden"
                style={{ animation: 'slideDown 0.15s ease-out' }}
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
                              isReplying ? 'bg-accent/5' : 'hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="relative flex-shrink-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${
                                unread > 0 ? 'bg-accent/20 text-accent' : 'bg-white/[0.08] text-white/50'
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
                                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                                  replyText.trim() ? 'bg-accent text-dark' : 'bg-white/[0.06] text-white/20'
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
          <button className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
          </button>

          {/* User menu */}
          <div ref={userMenuRef} className="relative ml-1">
            <button
              type="button"
              onClick={() => setUserMenuOpen((v) => !v)}
              className={`
                flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-2xl transition-colors
                ${userMenuOpen ? 'bg-white/[0.06]' : 'hover:bg-white/[0.06]'}
              `}
            >
              <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-xs flex-shrink-0">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-white leading-tight">
                  {user?.firstName || 'Admin'} {user?.lastName || 'User'}
                </p>
                <p className="text-[11px] text-muted leading-tight">Administrátor</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-white/35 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[rgb(30,30,30)] border border-white/[0.08] rounded-2xl shadow-xl shadow-black/40 overflow-hidden">
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
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.06] hover:text-white transition-colors"
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
