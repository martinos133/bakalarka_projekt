import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="sk" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
