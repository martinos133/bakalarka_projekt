'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getAuthUser, hasPermission, isOwnerAdmin } from '@/lib/auth'
import api from '@/lib/api'
import {
  LayoutDashboard,
  FileText,
  Users,
  FolderTree,
  Mail,
  Clock,
  Flag,
  Settings,
  Code,
  Navigation,
  Boxes,
  Sliders,
  MousePointerClick,
  FileCode,
  BookOpen,
  ListChecks,
  ChevronLeft,
  LogOut,
  CalendarDays,
  UserCog,
  MessageCircle,
  Shield,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    title: 'Nástenky',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
      { label: 'Organizér', path: '/dashboard/organizer', icon: CalendarDays, permission: 'organizer' },
      { label: 'Inzeráty', path: '/dashboard/advertisements', icon: FileText, permission: 'advertisements' },
      { label: 'Používatelia', path: '/dashboard/users', icon: Users, permission: 'users' },
      { label: 'Kategórie', path: '/dashboard/categories', icon: FolderTree, permission: 'categories' },
      { label: 'Špecifikácie', path: '/dashboard/specifications', icon: ListChecks, permission: 'specifications' },
      { label: 'Monitoring', path: '/dashboard/monitoring', icon: MousePointerClick, permission: 'monitoring' },
    ],
  },
  {
    title: 'Komunikácia',
    items: [
      { label: 'Tímový chat', path: '/dashboard/team-chat', icon: MessageCircle, permission: 'team_chat' },
      { label: 'Kontaktné formuláre', path: '/dashboard/contact-forms', icon: Mail, permission: 'contact_forms' },
    ],
  },
  {
    title: 'Moderácia',
    items: [
      { label: 'Čakajúce inzeráty', path: '/dashboard/pending', icon: Clock, permission: 'pending' },
      { label: 'Nahlásené inzeráty', path: '/dashboard/reported', icon: Flag, permission: 'reported' },
    ],
  },
  {
    title: 'Správa',
    items: [
      { label: 'Tím', path: '/dashboard/staff', icon: UserCog, permission: 'staff' },
      { label: 'Audit & Logy', path: '/dashboard/audit', icon: Shield, permission: 'audit' },
    ],
  },
  {
    title: 'Obsah',
    items: [
      { label: 'Statické stránky', path: '/dashboard/dev/static-pages', icon: FileCode, permission: 'static_pages' },
      { label: 'Blog', path: '/dashboard/dev/blog', icon: BookOpen, permission: 'blog' },
    ],
  },
  {
    title: 'Development',
    items: [
      { label: 'Kategórie', path: '/dashboard/dev/categories', icon: FolderTree, permission: 'dev_categories' },
      { label: 'Inzeráty', path: '/dashboard/dev/advertisements', icon: FileText, permission: 'dev_advertisements' },
      { label: 'Menu', path: '/dashboard/dev/menu', icon: Navigation, permission: 'dev_menu' },
      { label: 'Komponenty', path: '/dashboard/dev/components', icon: Boxes, permission: 'dev_components' },
      { label: 'Konfigurácia', path: '/dashboard/dev/config', icon: Sliders, permission: 'dev_config' },
    ],
  },
  {
    items: [
      { label: 'Nastavenia', path: '/dashboard/settings', icon: Settings, permission: 'settings' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [chatUnread, setChatUnread] = useState(0)

  useEffect(() => {
    setUser(getAuthUser())
  }, [])

  const loadChatUnread = useCallback(async () => {
    if (!hasPermission('team_chat')) return
    try {
      const u = await api.getChatUnread()
      setChatUnread(u?.total ?? 0)
    } catch {
      setChatUnread(0)
    }
  }, [])

  useEffect(() => {
    loadChatUnread()
    const t = setInterval(loadChatUnread, 12000)
    return () => clearInterval(t)
  }, [loadChatUnread])

  const owner = isOwnerAdmin()

  const filteredNavigation = useMemo(() => {
    return navigation
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          !item.permission || hasPermission(item.permission)
        ),
      }))
      .filter((section) => section.items.length > 0)
  }, [user])

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return (first + last).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'A'
  }

  return (
    <div
      className={`
        ${collapsed ? 'w-[72px]' : 'w-64'} bg-card h-screen fixed left-0 top-0
        flex flex-col border-r border-white/[0.06] transition-all duration-300 z-40
      `}
    >
      {/* User profile */}
      <div className={`p-4 ${collapsed ? 'px-3' : 'px-5'} pt-6 pb-4`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm flex-shrink-0">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.firstName || 'Admin'} {user?.lastName || ''}
              </p>
              <p className="text-xs text-muted truncate">
                {owner ? 'Administrátor' : 'Člen tímu'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-white/[0.06] mx-4" />

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-4 ${collapsed ? 'px-2' : 'px-3'}`}>
        {filteredNavigation.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-5">
            {section.title && !collapsed && (
              <h2 className="text-[10px] font-semibold text-muted uppercase tracking-widest mb-2 px-3">
                {section.title}
              </h2>
            )}
            {collapsed && section.title && (
              <div className="h-px bg-white/[0.06] mx-2 mb-2" />
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.path
                const Icon = item.icon
                const showChatBadge = item.path === '/dashboard/team-chat' && chatUnread > 0
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    title={collapsed ? item.label : undefined}
                    className={`
                      w-full text-left rounded-xl transition-all duration-150
                      flex items-center
                      ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2 gap-3'}
                      ${isActive
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                      }
                    `}
                  >
                    <span className="relative inline-flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center">
                      <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-accent' : ''}`} strokeWidth={2} />
                      {showChatBadge && (
                        <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold leading-none text-white shadow-md shadow-red-500/35 ring-2 ring-card">
                          {chatUnread > 9 ? '9+' : chatUnread}
                        </span>
                      )}
                    </span>
                    {!collapsed && <span className="text-sm">{item.label}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={`border-t border-white/[0.06] p-3 ${collapsed ? 'px-2' : ''}`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-400 hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span className="text-sm">Zbaliť</span>}
        </button>
      </div>
    </div>
  )
}
