'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // Presmerovanie na login, ak používateľ nie je prihlásený
    const token = localStorage.getItem('admin_token')
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-xl">Presmerovávanie...</div>
    </div>
  )
}
