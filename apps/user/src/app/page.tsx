'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { isAuthenticated, getAuthUser, logout } from '@/lib/auth'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated()) {
      setUser(getAuthUser())
    }
  }, [])

  const handleLogout = () => {
    logout()
    setUser(null)
    router.push('/')
  }

  if (!mounted) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-gray-500">Načítavam...</div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">Môj Účet</h1>
        
        {user ? (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Vitajte, {user.firstName || user.email}!</h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> {user.email}</p>
                {user.firstName && <p><strong>Meno:</strong> {user.firstName} {user.lastName}</p>}
              </div>
            </div>
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Funkcie:</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Profil používateľa</li>
                <li>Správa vlastných inzerátov</li>
                <li>Nastavenia účtu</li>
                <li>História aktivít</li>
              </ul>
            </div>
            <button
              onClick={handleLogout}
              className="mt-6 w-full bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Odhlásiť sa
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-lg mb-6 text-gray-700">Konto používateľa pre správu inzerátov</p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/login"
                className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-900 font-semibold rounded-lg hover:border-gray-400 transition-colors"
              >
                Prihlásiť sa
              </Link>
              <Link
                href="/register"
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Registrovať sa
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
