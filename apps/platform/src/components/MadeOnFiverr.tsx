'use client'

import Link from 'next/link'

export default function MadeOnRentMe() {
  const examples = [
    {
      id: '1',
      title: 'Dizajn loga',
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop',
      description: 'Profesionálny dizajn loga pre vašu značku',
    },
    {
      id: '2',
      title: 'Vývoj webu',
      image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop',
      description: 'Vlastný web vytvorený podľa vašich špecifikácií',
    },
    {
      id: '4',
      title: 'Produkcia videa',
      image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44b?w=400&h=300&fit=crop',
      description: 'Vysokokvalitný video obsah pre váš biznis',
    },
    {
      id: '7',
      title: 'Písanie obsahu',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop',
      description: 'Pútavý obsah, ktorý konvertuje',
    },
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Vytvorené na RentMe
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {examples.map((example, index) => (
            <Link
              key={example.id}
              href={`/inzerat/${example.id}`}
              className="group cursor-pointer overflow-hidden rounded-lg"
            >
              <div className="relative overflow-hidden">
                <img
                  src={example.image}
                  alt={example.title}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-[#1dbf73] transition-colors">
                  {example.title}
                </h3>
                <p className="text-sm text-gray-600">{example.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
