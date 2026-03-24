import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prémiové balíky | RentMe Pro',
  description:
    'Zvýraznite svoje inzeráty, získajte viac zobrazení a dôveryhodnosti. Prehľadné balíky pre súkromných predajcov aj firmy.',
}

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return children
}
