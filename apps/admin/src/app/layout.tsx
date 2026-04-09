import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Admin Panel - Inzertná Platforma',
  description: 'CEO Admin Panel pre správu inzertnej platformy',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sk" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
