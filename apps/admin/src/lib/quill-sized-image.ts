let registered = false

export type ImgBlockAlign = 'left' | 'center' | 'right'

export type ImageEmbedValue =
  | string
  | { src: string; width?: number; align?: ImgBlockAlign }

export function normalizeImgAlign(v: unknown): ImgBlockAlign {
  if (v === 'left' || v === 'right' || v === 'center') return v
  return 'center'
}

/** Inline štýl pre vložený obrázok (šírka % stĺpca + zarovnanie bloku) */
export function buildSizedImageStyle(widthPct: number, align: ImgBlockAlign): string {
  const w = Math.min(100, Math.max(25, widthPct))
  const r = 'border-radius:12px;'
  const base = `max-width:${w}%; height:auto; ${r}`
  switch (align) {
    case 'left':
      return `${base} display:block; margin:1rem auto 1rem 0;`
    case 'right':
      return `${base} display:block; margin:1rem 0 1rem auto;`
    default:
      return `${base} display:block; margin:1rem auto;`
  }
}

/** Čítanie zarovnania z uloženého HTML (editor + náhľad) */
export function readSizedImageAlign(domNode: HTMLImageElement): ImgBlockAlign {
  const raw = domNode.getAttribute('data-img-align')
  if (raw === 'left' || raw === 'right' || raw === 'center') return raw
  const s = domNode.getAttribute('style') || ''
  if (/margin:\s*1rem\s+0\s+1rem\s+auto/.test(s)) return 'right'
  if (/margin:\s*1rem\s+auto\s+1rem\s+0/.test(s)) return 'left'
  if (/margin:\s*1rem\s+auto\b/.test(s)) return 'center'
  return 'center'
}

/**
 * Nahradí predvolený Quill formát `image` – ukladá šírku ako max-width (%) a zarovnanie bloku.
 */
export function registerSizedImageFormat(Quill: {
  import: (name: string) => any
  register: (format: any, force?: boolean) => void
}) {
  if (registered) return
  const BaseImage = Quill.import('formats/image')

  class SizedImage extends BaseImage {
    static create(value: ImageEmbedValue) {
      const src = typeof value === 'string' ? value : (value?.src ?? '')
      const w =
        typeof value === 'object' && value != null && value.width != null
          ? Math.min(100, Math.max(25, Number(value.width)))
          : 100
      const align =
        typeof value === 'object' && value != null
          ? normalizeImgAlign(value.align)
          : 'center'
      const node = super.create(src) as HTMLImageElement
      node.setAttribute('style', buildSizedImageStyle(w, align))
      node.setAttribute('data-img-width', String(w))
      node.setAttribute('data-img-align', align)
      return node
    }

    static value(domNode: HTMLImageElement): ImageEmbedValue {
      const src = domNode.getAttribute('src') || ''
      const dw = domNode.getAttribute('data-img-width')
      let width = 100
      if (dw != null && /^\d{1,3}$/.test(dw)) {
        width = Math.min(100, Math.max(25, parseInt(dw, 10)))
      } else {
        const style = domNode.getAttribute('style') || ''
        const m = style.match(/max-width:\s*(\d+)%/)
        if (m) width = Math.min(100, Math.max(25, parseInt(m[1], 10)))
      }
      const align = readSizedImageAlign(domNode)
      return { src, width, align }
    }
  }

  Quill.register(SizedImage, true)
  registered = true
}
