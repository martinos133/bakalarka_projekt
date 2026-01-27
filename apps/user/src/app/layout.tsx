import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Môj Účet - Inzertná Platforma',
  description: 'Konto používateľa pre správu inzerátov',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sk">
      <body>{children}</body>
    </html>
  )
}
