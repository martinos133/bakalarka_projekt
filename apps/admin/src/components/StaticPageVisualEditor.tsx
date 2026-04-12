'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export type StaticPageVisualEditorHandle = {
  getContent: () => string
}

export function splitStoredPageContent(raw: string): { css: string; html: string } {
  const empty =
    '<div class="p-4"><p>Pridajte blok z panela vľavo alebo sem napíšte text.</p></div>'
  if (!raw?.trim()) return { css: '', html: empty }
  const m = raw.match(/^<style[^>]*>([\s\S]*?)<\/style>\s*/i)
  if (m) {
    return {
      css: m[1].trim(),
      html: raw.slice(m[0].length).trim() || empty,
    }
  }
  return { css: '', html: raw.trim() }
}

/**
 * Export z Grapes (celý dokument) alebo vložené HTML stránky → jeden reťazec v tvare
 * voliteľný <style> z head + innerHTML body, aby splitStoredPageContent a GrapesJS dostali fragment.
 */
export function normalizeStoredPageHtml(raw: string): string {
  const t = raw?.trim() ?? ''
  if (!t) return t
  const looksLikeDoc = /^<!DOCTYPE/i.test(t) || /<html[\s>]/i.test(t)
  if (!looksLikeDoc || typeof DOMParser === 'undefined') return t
  try {
    const doc = new DOMParser().parseFromString(t, 'text/html')
    const bodyHtml = doc.body?.innerHTML?.trim() ?? ''
    const headStyles = Array.from(doc.querySelectorAll('head style'))
      .map((s) => (s.textContent || '').trim())
      .filter(Boolean)
      .join('\n')
    if (!bodyHtml && !headStyles) return t
    const stylePrefix = headStyles ? `<style>${headStyles}</style>` : ''
    return stylePrefix + bodyHtml
  } catch {
    return t
  }
}

type Props = {
  initialHtml: string
}

const StaticPageVisualEditor = forwardRef<StaticPageVisualEditorHandle, Props>(
  function StaticPageVisualEditor({ initialHtml }, ref) {
    const hostRef = useRef<HTMLDivElement>(null)
    const initialHtmlRef = useRef(initialHtml)
    initialHtmlRef.current = initialHtml
    /** GrapesJS Editor – typ getCss sa líši podľa verzie */
    const editorInstanceRef = useRef<{
      destroy: () => void
      getHtml: () => string
      getCss: () => string | undefined
      setStyle?: (s: string) => void
      setComponents: (c: string) => void
      refresh: () => void
      once: (ev: string, fn: () => void) => void
    } | null>(null)

    useImperativeHandle(ref, () => ({
      getContent: () => {
        const ed = editorInstanceRef.current
        if (!ed) return initialHtmlRef.current
        const html = ed.getHtml()
        const css = ed.getCss()
        const cssBlock = css?.trim() ? `<style>${css}</style>` : ''
        return `${cssBlock}${html}`
      },
    }))

    useEffect(() => {
      const host = hostRef.current
      if (!host) return

      let cancelled = false
      const timers: number[] = []
      const normalized = normalizeStoredPageHtml(initialHtml)
      const { css, html } = splitStoredPageContent(normalized)

      ;(async () => {
        const [{ default: grapesjs }, { default: preset }] = await Promise.all([
          import('grapesjs'),
          import('grapesjs-preset-webpage'),
        ])
        await import('grapesjs/dist/css/grapes.min.css')

        if (cancelled || !hostRef.current) return

        // V 0.22 sa `components` / `style` mapujú na pageManager – načítajú sa skôr než len setComponents po load.
        const editor = grapesjs.init({
          container: hostRef.current,
          height: '72vh',
          width: 'auto',
          storageManager: false,
          components: html,
          ...(css ? { style: css } : {}),
          plugins: [preset],
          pluginsOpts: {
            'gjs-preset-webpage': {
              useCustomTheme: false,
            },
          },
        })

        editorInstanceRef.current = editor

        const pushContent = () => {
          if (cancelled || !editorInstanceRef.current) return
          const ed = editorInstanceRef.current
          try {
            if (css) ed.setStyle?.(css)
            ed.setComponents(html)
            ed.refresh()
          } catch {
            try {
              ed.setComponents(html)
              ed.refresh()
            } catch {
              /* ignore */
            }
          }
        }

        editor.once('load', () => {
          queueMicrotask(pushContent)
          requestAnimationFrame(pushContent)
        })
        queueMicrotask(pushContent)
        ;[30, 200, 600, 1200].forEach((ms) => {
          timers.push(
            window.setTimeout(() => {
              if (cancelled) return
              pushContent()
            }, ms)
          )
        })
      })()

      return () => {
        cancelled = true
        timers.forEach((t) => window.clearTimeout(t))
        editorInstanceRef.current?.destroy()
        editorInstanceRef.current = null
        if (hostRef.current) hostRef.current.innerHTML = ''
      }
    }, [initialHtml])

    return (
      <div className="rounded-xl border border-card overflow-hidden bg-[#444]">
        <p className="text-xs text-gray-400 px-3 py-2 border-b border-white/10 bg-black/20">
          Vizual builder: bloky vľavo, štýly vpravo, náhľad v strede (podobné Elementoru). Uložené sa vykreslí na
          platforme ako HTML.
        </p>
        <div ref={hostRef} className="min-h-[72vh]" />
      </div>
    )
  }
)

export default StaticPageVisualEditor
