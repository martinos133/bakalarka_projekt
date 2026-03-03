import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Stať sa predajcom | RentMe',
  description:
    'Ponúkajte služby alebo prenájmy na RentMe. Jednoduchý postup: registrácia, vytvorenie inzerátu, doplnenie profilu a príjem objednávok. Začnite ešte dnes.',
}

export default function BecomeSellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
