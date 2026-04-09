'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export type CmsPublishedPage = { title: string; content: string }

/** Ak existuje publikovaná CMS stránka s daným slugom, vráti ju; inak page === null. */
export function useCmsOverride(cmsSlug: string) {
  const [loading, setLoading] = useState(!!cmsSlug)
  const [page, setPage] = useState<CmsPublishedPage | null>(null)

  useEffect(() => {
    if (!cmsSlug) {
      setLoading(false)
      setPage(null)
      return
    }
    let alive = true
    api
      .getStaticPage(cmsSlug)
      .then((d) => {
        if (alive) setPage({ title: d.title, content: d.content })
      })
      .catch(() => {
        if (alive) setPage(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [cmsSlug])

  return { loading, page }
}
