'use client'

import { useRouter } from 'next/navigation'

interface QuickAction {
  label: string
  description: string
  path: string
  icon?: string
}

const actions: QuickAction[] = [
  {
    label: 'Nový inzerát',
    description: 'Pridať inzerát do systému',
    path: '/dashboard/advertisements/new',
  },
  {
    label: 'Nová kategória',
    description: 'Vytvoriť kategóriu',
    path: '/dashboard/categories/new',
  },
  {
    label: 'Správa inzerátov',
    description: 'Spravovať inzeráty',
    path: '/dashboard/advertisements',
  },
  {
    label: 'Správa používateľov',
    description: 'Spravovať používateľov',
    path: '/dashboard/users',
  },
  {
    label: 'Moderácia obsahu',
    description: 'Moderovať obsah',
    path: '/dashboard/moderate',
  },
  {
    label: 'Nastavenia',
    description: 'Konfigurácia systému',
    path: '/dashboard/settings',
  },
]

export default function QuickActions() {
  const router = useRouter()

  const handleAction = (path: string) => {
    router.push(path)
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-dark">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Rýchle akcie</h3>
        <p className="text-sm text-gray-400">Najčastejšie používané funkcie</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <button
            key={action.path}
            onClick={() => handleAction(action.path)}
            className="bg-dark hover:bg-cardHover border border-card rounded-lg p-4 text-left transition-colors group"
          >
            <h4 className="text-white font-medium mb-1 group-hover:text-blue-400 transition-colors">
              {action.label}
            </h4>
            <p className="text-xs text-gray-400">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
