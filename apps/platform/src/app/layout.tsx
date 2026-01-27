import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RentMe | Trh freelancerských služieb | Nájdite top globálne talenty',
  description: 'Nájdite správneho freelancera a začnite pracovať na vašom projekte v priebehu minút.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sk" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
