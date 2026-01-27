'use client'

import { usePathname, useRouter } from 'next/navigation'

interface NavItem {
  label: string
  path: string
  icon?: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    title: 'Nástenky',
    items: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Inzeráty', path: '/dashboard/advertisements' },
      { label: 'Používatelia', path: '/dashboard/users' },
      { label: 'Kategórie', path: '/dashboard/categories' },
    ],
  },
  {
    title: 'Komunikácia',
    items: [
      { label: 'Kontaktné formuláre', path: '/dashboard/contact-forms' },
    ],
  },
  {
    title: 'Moderácia',
    items: [
      { label: 'Čakajúce inzeráty', path: '/dashboard/pending' },
      { label: 'Nahlásené inzeráty', path: '/dashboard/reported' },
    ],
  },
  {
    items: [
      { label: 'Nastavenia', path: '/dashboard/settings' },
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
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-card text-white font-medium' 
                        : 'text-gray-300 bg-transparent hover:bg-cardHover hover:text-white'
                      }
                    `}
                  >
                    {item.label}
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
