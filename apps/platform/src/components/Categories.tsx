'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function Categories() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await api.getCategories()
      // Filtruj len hlavné kategórie (bez parentId) a aktívne
      const mainCategories = data
        .filter((cat: any) => !cat.parentId && cat.status === 'ACTIVE')
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      setCategories(mainCategories)
    } catch (error) {
      console.error('Chyba pri načítaní kategórií:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">Načítavam kategórie...</div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Preskúmajte trh
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const subcategories = (category.children?.filter((child: any) => child.status === 'ACTIVE') || [])
              .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
            
            return (
              <Link
                key={category.id}
                href={`/kategoria/${category.slug}`}
                className="bg-white p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer group"
              >
                {category.image ? (
                  <div className="mb-4">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                ) : category.icon ? (
                  <div className="text-4xl mb-4">{category.icon}</div>
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-2xl text-gray-400">
                      {category.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-[#1dbf73] transition-colors">
                  {category.name}
                </h3>
                {subcategories.length > 0 && (
                  <ul className="space-y-2">
                    {subcategories.slice(0, 3).map((subcategory: any) => (
                      <li
                        key={subcategory.id}
                        className="text-sm text-gray-600 hover:text-[#1dbf73] transition-colors"
                      >
                        {subcategory.name}
                      </li>
                    ))}
                    {subcategories.length > 3 && (
                      <li className="text-sm text-gray-500">
                        +{subcategories.length - 3} ďalších
                      </li>
                    )}
                  </ul>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
