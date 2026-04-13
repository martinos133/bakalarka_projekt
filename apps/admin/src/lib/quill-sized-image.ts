let registered = false

type ImageEmbedValue = string | { src: string; width?: number }

/**
 * Nahradí predvolený Quill formát `image` – ukladá šírku ako max-width (%).
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
      const node = super.create(src) as HTMLImageElement
      node.setAttribute(
        'style',
        `max-width:${w}%; height:auto; display:block; margin:1rem auto; border-radius:12px;`,
      )
      node.setAttribute('data-img-width', String(w))
      return node
    }

    static value(domNode: HTMLImageElement): ImageEmbedValue {
      const src = domNode.getAttribute('src') || ''
      const dw = domNode.getAttribute('data-img-width')
      if (dw != null && /^\d{1,3}$/.test(dw)) {
        const width = Math.min(100, Math.max(25, parseInt(dw, 10)))
        return { src, width }
      }
      const style = domNode.getAttribute('style') || ''
      const m = style.match(/max-width:\s*(\d+)%/)
      if (m) {
        const width = Math.min(100, Math.max(25, parseInt(m[1], 10)))
        return { src, width }
      }
      return src
    }
  }

  Quill.register(SizedImage, true)
  registered = true
}
