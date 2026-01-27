'use client'

import { useRouter } from 'next/navigation'
import {
  FilePlus,
  FolderPlus,
  FileText,
  Users,
  Shield,
  Settings,
} from 'lucide-react'

interface QuickAction {
  label: string
  description: string
  path: string
  icon: React.ComponentType<{ className?: string }>
}

const actions: QuickAction[] = [
  {
    label: 'Nový inzerát',
    description: 'Pridať inzerát do systému',
    path: '/dashboard/advertisements/new',
    icon: FilePlus,
  },
  {
    label: 'Nová kategória',
    description: 'Vytvoriť kategóriu',
    path: '/dashboard/categories/new',
    icon: FolderPlus,
  },
  {
    label: 'Správa inzerátov',
    description: 'Spravovať inzeráty',
    path: '/dashboard/advertisements',
    icon: FileText,
  },
  {
    label: 'Správa používateľov',
    description: 'Spravovať používateľov',
    path: '/dashboard/users',
    icon: Users,
  },
  {
    label: 'Moderácia obsahu',
    description: 'Moderovať obsah',
    path: '/dashboard/moderate',
    icon: Shield,
  },
  {
    label: 'Nastavenia',
    description: 'Konfigurácia systému',
    path: '/dashboard/settings',
    icon: Settings,
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
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.path}
              onClick={() => handleAction(action.path)}
              className="bg-dark hover:bg-cardHover border border-card rounded-lg p-4 text-left transition-colors group"
            >
              <div className="flex items-center space-x-3 mb-2">
                <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                <h4 className="text-white font-medium group-hover:text-blue-400 transition-colors">
                  {action.label}
                </h4>
              </div>
              <p className="text-xs text-gray-400 ml-8">{action.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
