'use client'

export default function Categories() {
  const categories = [
    {
      name: 'Grafika a dizajn',
      icon: '🎨',
      services: ['Dizajn loga', 'Príručky štýlu značky', 'Vizitky'],
    },
    {
      name: 'Programovanie a technológie',
      icon: '💻',
      services: ['WordPress', 'Tvorcovia webov a CMS', 'Vývoj hier'],
    },
    {
      name: 'Digitálny marketing',
      icon: '📱',
      services: ['Marketing na sociálnych sieťach', 'SEO', 'Marketingová stratégia'],
    },
    {
      name: 'Písanie a preklad',
      icon: '✍️',
      services: ['Články a blogové príspevky', 'Preklad', 'Korektúra'],
    },
    {
      name: 'Video a animácia',
      icon: '🎬',
      services: ['Úprava videa', 'Animované GIFy', 'Animácia postáv'],
    },
    {
      name: 'Hudba a audio',
      icon: '🎵',
      services: ['Hlasové prevedenie', 'Mixovanie a mastering', 'Producenti a skladatelia'],
    },
    {
      name: 'Podnikanie',
      icon: '💼',
      services: ['Virtuálny asistent', 'Prieskum trhu', 'Podnikateľské plány'],
    },
    {
      name: 'Dáta',
      icon: '📊',
      services: ['Zadávanie dát', 'Analytika dát', 'Vizualizácia dát'],
    },
  ]

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Preskúmajte trh
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="text-4xl mb-4">{category.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-[#1dbf73] transition-colors">
                {category.name}
              </h3>
              <ul className="space-y-2">
                {category.services.map((service, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-600 hover:text-[#1dbf73] transition-colors"
                  >
                    {service}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
