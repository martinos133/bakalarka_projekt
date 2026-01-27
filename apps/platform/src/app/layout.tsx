import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Inzertná Platforma',
  description: 'Najväčšia inzertná platforma na Slovensku',
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
