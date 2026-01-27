'use client'

import { usePathname, useRouter } from 'next/navigation'
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
  Filter,
  Navigation,
  Boxes,
  Sliders,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    title: 'Nástenky',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Inzeráty', path: '/dashboard/advertisements', icon: FileText },
      { label: 'Používatelia', path: '/dashboard/users', icon: Users },
      { label: 'Kategórie', path: '/dashboard/categories', icon: FolderTree },
    ],
  },
  {
    title: 'Komunikácia',
    items: [
      { label: 'Kontaktné formuláre', path: '/dashboard/contact-forms', icon: Mail },
    ],
  },
  {
    title: 'Moderácia',
    items: [
      { label: 'Čakajúce inzeráty', path: '/dashboard/pending', icon: Clock },
      { label: 'Nahlásené inzeráty', path: '/dashboard/reported', icon: Flag },
    ],
  },
  {
    title: 'Development',
    items: [
      { label: 'Kategórie', path: '/dashboard/dev/categories', icon: FolderTree },
      { label: 'Inzeráty', path: '/dashboard/dev/advertisements', icon: FileText },
      { label: 'Filtre', path: '/dashboard/dev/filters', icon: Filter },
      { label: 'Navbar', path: '/dashboard/dev/navbar', icon: Navigation },
      { label: 'Komponenty', path: '/dashboard/dev/components', icon: Boxes },
      { label: 'Konfigurácia', path: '/dashboard/dev/config', icon: Sliders },
    ],
  },
  {
    items: [
      { label: 'Nastavenia', path: '/dashboard/settings', icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  return (
    <div className="w-64 bg-card text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-xl font-bold mb-8">Admin Panel</h1>
        
        {navigation.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6">
            {section.title && (
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
                {section.title}
              </h2>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.path
                const Icon = item.icon
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3
                      ${isActive 
                        ? 'bg-card text-white font-medium' 
                        : 'text-gray-300 bg-transparent hover:bg-cardHover hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        ))}
      </div>
    </div>
  )
}
