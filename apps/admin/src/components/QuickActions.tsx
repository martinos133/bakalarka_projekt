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
  color: string
}

const colorMap: Record<string, { bg: string; text: string }> = {
  blue:   { bg: 'bg-accent/10',    text: 'text-accent' },
  green:  { bg: 'bg-accent/10', text: 'text-accent' },
  purple: { bg: 'bg-purple-500/10',  text: 'text-purple-400' },
  orange: { bg: 'bg-orange-500/10',  text: 'text-orange-400' },
  red:    { bg: 'bg-red-500/10',     text: 'text-red-400' },
  gray:   { bg: 'bg-white/[0.06]',   text: 'text-gray-400' },
}

const actions: QuickAction[] = [
  {
    label: 'Nový inzerát',
    description: 'Pridať inzerát do systému',
    path: '/dashboard/advertisements/new',
    icon: FilePlus,
    color: 'blue',
  },
  {
    label: 'Nová kategória',
    description: 'Vytvoriť kategóriu',
    path: '/dashboard/categories/new',
    icon: FolderPlus,
    color: 'green',
  },
  {
    label: 'Správa inzerátov',
    description: 'Spravovať inzeráty',
    path: '/dashboard/advertisements',
    icon: FileText,
    color: 'purple',
  },
  {
    label: 'Správa používateľov',
    description: 'Spravovať používateľov',
    path: '/dashboard/users',
    icon: Users,
    color: 'orange',
  },
  {
    label: 'Moderácia obsahu',
    description: 'Moderovať obsah',
    path: '/dashboard/moderate',
    icon: Shield,
    color: 'red',
  },
  {
    label: 'Nastavenia',
    description: 'Konfigurácia systému',
    path: '/dashboard/settings',
    icon: Settings,
    color: 'gray',
  },
]

export default function QuickActions() {
  const router = useRouter()

  return (
    <div className="card p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-white">Rýchle akcie</h3>
        <p className="text-sm text-muted mt-0.5">Najčastejšie používané funkcie</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          const colors = colorMap[action.color] || colorMap.gray
          return (
            <button
              key={action.path}
              onClick={() => router.push(action.path)}
              className="group flex flex-col items-center gap-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.1] p-5 transition-all duration-200"
            >
              <div className={`w-12 h-12 rounded-2xl ${colors.bg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}>
                <Icon className={`w-5 h-5 ${colors.text}`} />
              </div>
              <span className="text-xs font-medium text-gray-300 group-hover:text-white text-center transition-colors">
                {action.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
