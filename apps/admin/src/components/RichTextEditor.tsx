'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { default as ReactQuillClass } from 'react-quill-new'
import { Image as ImageIcon, X } from 'lucide-react'

import 'react-quill-new/dist/quill.snow.css'

import {
  registerSizedImageFormat,
  buildSizedImageStyle,
  readSizedImageAlign,
  type ImgBlockAlign,
} from '@/lib/quill-sized-image'

/** Palety namiesto „prázdneho“ pickera – na tmavom UI sú štvorce vždy čitateľné */
/** Len farba písma (Quill format „color“) – vrátane modrej bez zmeny pozadia */
const TEXT_COLORS = [
  '#ffffff',
  '#fafafa',
  '#e4e4e7',
  '#a1a1aa',
  '#71717a',
  '#52525b',
  '#18181b',
  '#1d4ed8',
  '#2563eb',
  '#3b82f6',
  '#60a5fa',
  '#93c5fd',
  '#22d3ee',
  '#34d399',
  '#c9a96e',
  '#fbbf24',
  '#fb923c',
  '#f87171',
  '#fb7185',
  '#c084fc',
  '#a78bfa',
]

const BG_COLORS = [
  'transparent',
  '#27272a',
  '#3f3f46',
  '#1c1917',
  '#422006',
  '#14532d',
  '#1e3a5f',
  '#4c1d95',
  '#831843',
  '#7f1d1d',
  '#c9a96e',
  '#ffffff',
  '#fef3c7',
]

/** Base64 v HTML – rozumný limit pre článok (JPG/PNG/WebP/GIF) */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

function readImageWidthPct(img: HTMLImageElement): number {
  const dw = img.getAttribute('data-img-width')
  if (dw != null && /^\d{1,3}$/.test(dw)) {
    return Math.min(100, Math.max(25, parseInt(dw, 10)))
  }
  const style = img.getAttribute('style') || ''
  const m = style.match(/max-width:\s*(\d+)%/)
  if (m) return Math.min(100, Math.max(25, parseInt(m[1], 10)))
  return 100
}

/** Zarovnanie bloku v Quill (false = vľavo) */
type QuillBlockAlignUi = 'left' | 'center' | 'right' | 'justify'

function readAlignFromQuillFormat(align: string | undefined | false): QuillBlockAlignUi {
  if (align === 'center' || align === 'right' || align === 'justify') return align
  return 'left'
}

function quillAlignValue(ui: QuillBlockAlignUi): string | false {
  if (ui === 'left') return false
  return ui
}

const TEXT_ALIGN_POPOVER_W = 300

/** getEditor() – len API potrebné na layout (žiadny statický import quill kvôli SSR). */
type QuillEditorForLayout = {
  container: HTMLElement
  getBounds(
    index: number,
    length: number,
  ): {
    top: number
    left: number
    bottom: number
    width: number
    height: number
  } | null
}

/** Umiestnenie panela zarovnania pod oblasťou výberu alebo bloku (viewport). */
function computeTextAlignPopoverPosition(
  quill: QuillEditorForLayout,
  range: { index: number; length: number },
): { top: number; left: number } {
  const container = quill.container.getBoundingClientRect()
  const b = quill.getBounds(range.index, range.length)
  if (b == null || (b.height <= 0 && b.width <= 0)) {
    return { top: container.top + 8, left: 16 }
  }
  let top = container.top + b.bottom + 8
  let left = container.left + b.left + b.width / 2 - TEXT_ALIGN_POPOVER_W / 2
  if (top + 120 > window.innerHeight) top = Math.max(8, container.top + b.top - 8 - 52)
  left = Math.max(8, Math.min(left, window.innerWidth - TEXT_ALIGN_POPOVER_W - 8))
  return { top, left }
}

function applyImageStyle(img: HTMLImageElement, w: number, align: ImgBlockAlign) {
  const v = Math.min(100, Math.max(25, w))
  const a: ImgBlockAlign = align === 'left' || align === 'right' ? align : 'center'
  img.setAttribute('data-img-width', String(v))
  img.setAttribute('data-img-align', a)
  img.setAttribute('style', buildSizedImageStyle(v, a))
}

function createImageHandler(
  onPick: (dataUrl: string, insertIndex: number) => void,
) {
  return function imageHandler(this: { quill: { getSelection: (f: boolean) => { index: number } | null; getLength: () => number } }) {
    const quill = this.quill
    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/*')
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      if (file.size > MAX_IMAGE_SIZE) {
        alert('Obrázok môže mať max. 5 MB (JPG, PNG, WebP, GIF).')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (!result || result.length > 6_500_000) {
          alert('Obrázok je po vložení príliš veľký. Skús menší súbor alebo JPG.')
          return
        }
        const range = quill.getSelection(true)
        const index = range?.index ?? quill.getLength()
        onPick(result, index)
      }
      reader.readAsDataURL(file)
      input.value = ''
    }
    input.click()
  }
}

function makeToolbarModules() {
  return {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['blockquote', 'link', 'image'],
      /** Samostatné skupiny – v toolbare sú dva jasné nástroje: písmo vs. podklad */
      [{ color: TEXT_COLORS }],
      [{ background: BG_COLORS }],
      ['clean'],
    ],
    clipboard: {
      matchVisual: false,
    },
  }
}

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'align', 'blockquote', 'link', 'image',
  'color', 'background',
]

function buildQuillModules(imageHandlerFn: (this: any) => void) {
  const modules = makeToolbarModules()
  return {
    ...modules,
    toolbar: {
      container: modules.toolbar as any,
      handlers: {
        image: imageHandlerFn,
        color(this: { quill: { format: (name: string, value: string | boolean) => void } }, value: string) {
          this.quill.format('color', value || false)
        },
        background(this: { quill: { format: (name: string, value: string | boolean) => void } }, value: string) {
          const v =
            !value || value === 'transparent' || value === '#00000000' ? false : value
          this.quill.format('background', v)
        },
      },
    },
  }
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
}

type ImageModalState = { dataUrl: string; insertIndex: number } | null

type ImgPopoverState = {
  img: HTMLImageElement
  width: number
  initialWidth: number
  align: ImgBlockAlign
  initialAlign: ImgBlockAlign
  top: number
  left: number
} | null

type TextAlignPopoverState = {
  /** Jedna položka po kliknutí na blok; viac odsekov po označení myšou/klávesnicou */
  mode: 'block' | 'selection'
  anchorEl: HTMLElement | null
  lineStart: number
  /** Rozsah pre formatLine – celý blok alebo celý označený text */
  lineLength: number
  align: QuillBlockAlignUi
  initialAlign: QuillBlockAlignUi
  top: number
  left: number
} | null

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Napíšte obsah...',
  minHeight = 320,
  className = '',
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false)
  const [ReactQuill, setReactQuill] = useState<typeof ReactQuillClass | null>(null)
  const [imageModal, setImageModal] = useState<ImageModalState>(null)
  const [imageWidthPct, setImageWidthPct] = useState(100)
  const [imageAlign, setImageAlign] = useState<ImgBlockAlign>('center')
  const [imgPopover, setImgPopover] = useState<ImgPopoverState>(null)
  const [textAlignPopover, setTextAlignPopover] = useState<TextAlignPopoverState>(null)
  const quillRef = useRef<InstanceType<typeof ReactQuillClass> | null>(null)
  /** Quill len na klientovi (Quill.find) – bez top-level importu kvôli SSR. */
  const quillConstructorRef = useRef<(typeof import('quill'))['default'] | null>(null)
  const imgPopoverRef = useRef<ImgPopoverState>(null)
  const textAlignPopoverRef = useRef<TextAlignPopoverState>(null)
  const imageModalOpenRef = useRef(false)
  imgPopoverRef.current = imgPopover
  textAlignPopoverRef.current = textAlignPopover
  imageModalOpenRef.current = !!imageModal

  const openImageDialog = useCallback((dataUrl: string, insertIndex: number) => {
    setImageWidthPct(100)
    setImageAlign('center')
    setImageModal({ dataUrl, insertIndex })
  }, [])

  const imageHandlerFn = useMemo(() => createImageHandler(openImageDialog), [openImageDialog])

  const quillModules = useMemo(() => buildQuillModules(imageHandlerFn), [imageHandlerFn])

  const closeImageModal = useCallback(() => setImageModal(null), [])

  const confirmInsertImage = useCallback(() => {
    if (!imageModal) return
    const quill = quillRef.current?.getEditor()
    if (!quill) {
      setImageModal(null)
      return
    }
    const w = Math.min(100, Math.max(25, imageWidthPct))
    quill.insertEmbed(imageModal.insertIndex, 'image', {
      src: imageModal.dataUrl,
      width: w,
      align: imageAlign,
    })
    quill.setSelection(imageModal.insertIndex + 1)
    setImageModal(null)
  }, [imageModal, imageWidthPct, imageAlign])

  /** Odloženie mimo render – inak Quill/sync môže zavolať setState v rodičovi počas renderu dieťaťa. */
  const syncQuillHtml = useCallback(() => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return
    const html = quill.getSemanticHTML()
    queueMicrotask(() => {
      onChange(html)
    })
  }, [onChange])

  const handleQuillChange = useCallback(
    (content: string) => {
      queueMicrotask(() => {
        onChange(content)
      })
    },
    [onChange],
  )

  /** revert=true vráti pôvodnú šírku, false uloží aktuálnu (Hotovo / klik mimo) */
  const finalizeImgPopover = useCallback(
    (revert: boolean) => {
      const cur = imgPopoverRef.current
      if (!cur) return
      cur.img.style.outline = ''
      if (revert) {
        applyImageStyle(cur.img, cur.initialWidth, cur.initialAlign)
      } else {
        applyImageStyle(cur.img, cur.width, cur.align)
      }
      syncQuillHtml()
      setImgPopover(null)
    },
    [syncQuillHtml],
  )

  const finalizeTextAlignPopover = useCallback(
    (revert: boolean) => {
      const cur = textAlignPopoverRef.current
      if (!cur) return
      if (cur.anchorEl) cur.anchorEl.style.outline = ''
      const quill = quillRef.current?.getEditor()
      if (quill && revert) {
        quill.formatLine(cur.lineStart, cur.lineLength, 'align', quillAlignValue(cur.initialAlign))
      }
      syncQuillHtml()
      setTextAlignPopover(null)
    },
    [syncQuillHtml],
  )

  useEffect(() => {
    if (!imageModal) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeImageModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [imageModal, closeImageModal])

  useLayoutEffect(() => {
    let cancelled = false
    Promise.all([import('react-quill-new'), import('quill')])
      .then(([rqMod, { default: Quill }]) => {
        if (cancelled) return
        quillConstructorRef.current = Quill
        registerSizedImageFormat(Quill)
        setReactQuill(() => rqMod.default)
        setMounted(true)
      })
      .catch(() => {
        setMounted(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    const t = window.setTimeout(() => {
      const root = document.querySelector('.blog-editor .ql-toolbar')
      if (!root) return
      const colorLabel = root.querySelector('.ql-color .ql-picker-label')
      const bgLabel = root.querySelector('.ql-background .ql-picker-label')
      colorLabel?.setAttribute('title', 'Farba písma – zmení len farbu textu (napr. modrá), nie pozadie')
      bgLabel?.setAttribute('title', 'Podfarbenie – zmení len pozadie za textom')
    }, 100)
    return () => window.clearTimeout(t)
  }, [mounted])

  /** Klik na obrázok alebo textový blok → plávajúci panel (ako pri obrázku) */
  useEffect(() => {
    if (!mounted || imageModal) return
    const editor = document.querySelector('.blog-editor .ql-editor')
    if (!editor) return

    const placePopover = (rect: DOMRect) => ({
      top: rect.bottom + 8,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 308)),
    })

    const onEditorClick = (e: Event) => {
      const t = e.target as HTMLElement
      if (!editor.contains(t)) return
      if (t.closest('#rte-img-edit-popover') || t.closest('#rte-text-align-popover')) return

      const quill = quillRef.current?.getEditor()
      if (!quill) return

      if (t.tagName === 'IMG') {
        e.stopPropagation()
        finalizeTextAlignPopover(false)
        const img = t as HTMLImageElement
        const w = readImageWidthPct(img)
        const curOpen = imgPopoverRef.current
        if (curOpen?.img === img) {
          curOpen.img.style.outline = ''
          applyImageStyle(curOpen.img, curOpen.width, curOpen.align)
          syncQuillHtml()
          setImgPopover(null)
          return
        }
        const prev = imgPopoverRef.current
        if (prev && prev.img !== img) {
          prev.img.style.outline = ''
          applyImageStyle(prev.img, prev.width, prev.align)
          syncQuillHtml()
        }
        img.style.outline = '2px solid #c9a96e'
        const { top, left } = placePopover(img.getBoundingClientRect())
        const al = readSizedImageAlign(img)
        setImgPopover({
          img,
          width: w,
          initialWidth: w,
          align: al,
          initialAlign: al,
          top,
          left,
        })
        return
      }

      const blockEl = t.closest(
        'p,h1,h2,h3,h4,blockquote,li',
      ) as HTMLElement | null
      if (!blockEl || !editor.contains(blockEl)) return

      const selRange = quill.getSelection()
      if (selRange && selRange.length > 0) return

      const Q = quillConstructorRef.current
      if (!Q) return
      const blot = Q.find(blockEl, true) as { statics?: { blotName?: string }; length?: () => number } | null
      const blotName = blot?.statics?.blotName
      if (!blot || blotName === 'image' || blotName === 'video') return

      e.stopPropagation()

      const lineStart = quill.getIndex(blot as never)
      const lineTuple = quill.getLine(lineStart) as unknown as [{ length?: () => number } | null, number]
      const lineBlot = lineTuple[0]
      const lineLength =
        lineBlot && typeof lineBlot.length === 'function' ? Math.max(1, lineBlot.length()) : 1
      const fmt = quill.getFormat(lineStart, 1)
      const initialAlign = readAlignFromQuillFormat(fmt.align as string | false | undefined)

      const openTxt = textAlignPopoverRef.current
      if (openTxt?.mode === 'block' && openTxt.anchorEl === blockEl) {
        finalizeTextAlignPopover(false)
        return
      }

      finalizeImgPopover(false)

      const prevTxt = textAlignPopoverRef.current
      if (prevTxt && !(prevTxt.mode === 'block' && prevTxt.anchorEl === blockEl)) {
        finalizeTextAlignPopover(false)
      }

      blockEl.style.outline = '2px solid #c9a96e'
      const { top, left } = placePopover(blockEl.getBoundingClientRect())
      setTextAlignPopover({
        mode: 'block',
        anchorEl: blockEl,
        lineStart,
        lineLength,
        align: initialAlign,
        initialAlign,
        top,
        left,
      })
    }

    let selCollapseTimer: number | undefined
    let keyOpenTimer: number | undefined

    const tryOpenSelectionAlignPopover = () => {
      window.clearTimeout(selCollapseTimer)
      if (imageModalOpenRef.current) return
      if (imgPopoverRef.current) return
      const q = quillRef.current?.getEditor()
      if (!q) return
      const range = q.getSelection(true)
      if (!range || range.length < 1) return

      const prev = textAlignPopoverRef.current
      if (
        prev?.mode === 'selection' &&
        prev.lineStart === range.index &&
        prev.lineLength === range.length
      ) {
        finalizeTextAlignPopover(false)
        return
      }

      finalizeImgPopover(false)
      if (prev) finalizeTextAlignPopover(false)

      const fmt = q.getFormat(range.index, 1)
      const initialAlign = readAlignFromQuillFormat(fmt.align as string | false | undefined)
      const pos = computeTextAlignPopoverPosition(q, range)
      setTextAlignPopover({
        mode: 'selection',
        anchorEl: null,
        lineStart: range.index,
        lineLength: range.length,
        align: initialAlign,
        initialAlign,
        top: pos.top,
        left: pos.left,
      })
    }

    const onSelectionChangeForClose = (range: { index: number; length: number } | null) => {
      window.clearTimeout(selCollapseTimer)
      if (range && range.length > 0) return
      selCollapseTimer = window.setTimeout(() => {
        const cur = textAlignPopoverRef.current
        if (cur?.mode === 'selection') finalizeTextAlignPopover(false)
      }, 150)
    }

    const quillInst = quillRef.current?.getEditor()
    quillInst?.on('selection-change', onSelectionChangeForClose)

    const onKeyUpDebounced = () => {
      window.clearTimeout(keyOpenTimer)
      keyOpenTimer = window.setTimeout(tryOpenSelectionAlignPopover, 280)
    }

    editor.addEventListener('click', onEditorClick, true)
    editor.addEventListener('mouseup', tryOpenSelectionAlignPopover)
    editor.addEventListener('keyup', onKeyUpDebounced)
    return () => {
      editor.removeEventListener('click', onEditorClick, true)
      editor.removeEventListener('mouseup', tryOpenSelectionAlignPopover)
      editor.removeEventListener('keyup', onKeyUpDebounced)
      window.clearTimeout(selCollapseTimer)
      window.clearTimeout(keyOpenTimer)
      quillInst?.off('selection-change', onSelectionChangeForClose)
    }
  }, [mounted, imageModal, value, syncQuillHtml, finalizeTextAlignPopover, finalizeImgPopover])

  useEffect(() => {
    if (!imgPopover && !textAlignPopover) return
    const onDocDown = (e: Event) => {
      const el = e.target as HTMLElement
      if (imgPopover?.img.contains(el)) return
      if (textAlignPopover?.anchorEl?.contains(el)) return
      if (el.closest('#rte-img-edit-popover') || el.closest('#rte-text-align-popover')) return
      if (imgPopover) finalizeImgPopover(false)
      if (textAlignPopover) finalizeTextAlignPopover(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (textAlignPopoverRef.current) finalizeTextAlignPopover(true)
      else if (imgPopoverRef.current) finalizeImgPopover(true)
    }
    const onScrollOrResize = () => {
      const imgCur = imgPopoverRef.current
      if (imgCur) {
        const rect = imgCur.img.getBoundingClientRect()
        const top = rect.bottom + 8
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - 308))
        setImgPopover((p) => (p ? { ...p, top, left } : null))
      }
      const txtCur = textAlignPopoverRef.current
      if (txtCur) {
        if (txtCur.mode === 'selection') {
          const q = quillRef.current?.getEditor()
          if (q) {
            const pos = computeTextAlignPopoverPosition(q, {
              index: txtCur.lineStart,
              length: txtCur.lineLength,
            })
            setTextAlignPopover((p) => (p?.mode === 'selection' ? { ...p, ...pos } : p))
          }
        } else if (txtCur.anchorEl) {
          const rect = txtCur.anchorEl.getBoundingClientRect()
          const top = rect.bottom + 8
          const left = Math.max(8, Math.min(rect.left, window.innerWidth - 308))
          setTextAlignPopover((p) => (p ? { ...p, top, left } : null))
        }
      }
    }
    document.addEventListener('mousedown', onDocDown, true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', onDocDown, true)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [imgPopover, textAlignPopover, finalizeImgPopover, finalizeTextAlignPopover])

  useLayoutEffect(() => {
    if (!imgPopover) return
    const rect = imgPopover.img.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 308))
    setImgPopover((p) => (p && p.img === imgPopover.img ? { ...p, top, left } : p))
  }, [imgPopover?.width, imgPopover?.align, imgPopover?.img])

  useLayoutEffect(() => {
    if (!textAlignPopover) return
    if (textAlignPopover.mode === 'selection') {
      const q = quillRef.current?.getEditor()
      if (!q) return
      const pos = computeTextAlignPopoverPosition(q, {
        index: textAlignPopover.lineStart,
        length: textAlignPopover.lineLength,
      })
      setTextAlignPopover((p) =>
        p && p.mode === 'selection' && p.lineStart === textAlignPopover.lineStart && p.lineLength === textAlignPopover.lineLength
          ? { ...p, top: pos.top, left: pos.left }
          : p,
      )
      return
    }
    if (!textAlignPopover.anchorEl) return
    const rect = textAlignPopover.anchorEl.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 308))
    setTextAlignPopover((p) =>
      p && p.anchorEl === textAlignPopover.anchorEl ? { ...p, top, left } : p,
    )
  }, [
    textAlignPopover?.align,
    textAlignPopover?.anchorEl,
    textAlignPopover?.mode,
    textAlignPopover?.lineStart,
    textAlignPopover?.lineLength,
  ])

  if (!mounted || !ReactQuill) {
    return (
      <div
        className={`bg-white/[0.06] border border-white/[0.06] rounded-xl ${className}`}
        style={{ minHeight, padding: 16 }}
      >
        <div className="text-gray-500">Načítavam editor...</div>
      </div>
    )
  }

  return (
    <div className={`blog-editor relative ${className}`}>
      {imageModal ? (
        <div
          className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rte-image-dialog-title"
        >
          <div className="card w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.1] bg-[#141416] p-0 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-accent" aria-hidden />
                <h2 id="rte-image-dialog-title" className="text-lg font-semibold text-white">
                  Vložiť obrázok
                </h2>
              </div>
              <button
                type="button"
                onClick={closeImageModal}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                aria-label="Zavrieť"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[40vh] overflow-hidden bg-black/30 px-5 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageModal.dataUrl}
                alt="Náhľad"
                className="mx-auto max-h-[36vh] w-auto max-w-full rounded-xl object-contain"
              />
            </div>
            <div className="space-y-4 px-5 py-5">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-300">Zarovnanie obrázka</p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { k: 'left' as const, label: 'Vľavo' },
                      { k: 'center' as const, label: 'Stred' },
                      { k: 'right' as const, label: 'Vpravo' },
                    ] as const
                  ).map(({ k, label }) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setImageAlign(k)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        imageAlign === k
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-white/[0.12] text-gray-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Text zarovnáš kliknutím na odsek, alebo označ viac odsekov myšou / klávesnicou – po uvoľnení sa otvorí rovnaký panel.
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="rte-img-width" className="text-sm font-medium text-gray-300">
                    Šírka v článku
                  </label>
                  <span className="tabular-nums text-sm font-semibold text-accent">{imageWidthPct}%</span>
                </div>
                <input
                  id="rte-img-width"
                  type="range"
                  min={25}
                  max={100}
                  step={5}
                  value={imageWidthPct}
                  onChange={(e) => setImageWidthPct(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-accent"
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Presná hodnota</span>
                  <input
                    type="number"
                    min={25}
                    max={100}
                    value={imageWidthPct}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10)
                      if (!Number.isFinite(n)) return
                      setImageWidthPct(Math.min(100, Math.max(25, n)))
                    }}
                    className="input w-24 rounded-lg border border-white/[0.12] bg-white/[0.05] px-2 py-1.5 text-sm text-white"
                  />
                  <span className="text-xs text-gray-500">% šírky textu (25–100)</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                Menšie percento = užší obrázok v stĺpci článku. Môžeš doladiť číslom alebo posuvníkom.
              </p>
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeImageModal}
                  className="rounded-xl border border-white/[0.12] bg-transparent px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/[0.06]"
                >
                  Zrušiť
                </button>
                <button
                  type="button"
                  onClick={confirmInsertImage}
                  className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-[#1a1a1a] transition-opacity hover:opacity-90"
                >
                  Vložiť do článku
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {textAlignPopover ? (
        <div
          id="rte-text-align-popover"
          role="dialog"
          aria-label="Zarovnanie textu"
          className="fixed z-[20001] w-[min(calc(100vw-16px),300px)] rounded-xl border border-white/[0.12] bg-[#1a1a1c] p-4 shadow-2xl"
          style={{ top: textAlignPopover.top, left: textAlignPopover.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-accent">Zarovnanie textu</p>
          <p className="mb-2 text-xs text-gray-400">
            {textAlignPopover.mode === 'selection'
              ? 'Platí pre všetky odseky v označení. Hotovo uloží; Zruší vráti pôvodné.'
              : 'Platí pre celý tento odsek / položku zoznamu. Hotovo uloží; Zruší vráti pôvodné.'}
          </p>
          <div className="mb-3 flex flex-wrap gap-1">
            {(
              [
                { k: 'left' as const, label: 'Vľavo' },
                { k: 'center' as const, label: 'Stred' },
                { k: 'right' as const, label: 'Vpravo' },
                { k: 'justify' as const, label: 'Do bloku' },
              ] as const
            ).map(({ k, label }) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  const q = quillRef.current?.getEditor()
                  setTextAlignPopover((p) => {
                    if (!p) return null
                    q?.formatLine(p.lineStart, p.lineLength, 'align', quillAlignValue(k))
                    return { ...p, align: k }
                  })
                  syncQuillHtml()
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  textAlignPopover.align === k
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-white/[0.12] text-gray-300 hover:bg-white/[0.06]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => finalizeTextAlignPopover(true)}
              className="rounded-lg border border-white/[0.12] px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/[0.06]"
            >
              Zrušiť
            </button>
            <button
              type="button"
              onClick={() => finalizeTextAlignPopover(false)}
              className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#1a1a1a] hover:opacity-90"
            >
              Hotovo
            </button>
          </div>
        </div>
      ) : null}

      {imgPopover ? (
        <div
          id="rte-img-edit-popover"
          role="dialog"
          aria-label="Úprava obrázka (šírka a zarovnanie)"
          className="fixed z-[20001] w-[min(calc(100vw-16px),300px)] rounded-xl border border-white/[0.12] bg-[#1a1a1c] p-4 shadow-2xl"
          style={{ top: imgPopover.top, left: imgPopover.left }}
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-accent">Úprava obrázka</p>
          <p className="mb-2 text-xs text-gray-400">
            Šírka a zarovnanie v stĺpci. Hotovo uloží; Zruší vráti pôvodné.
          </p>
          <p className="mb-1.5 text-xs text-gray-300">Zarovnanie</p>
          <div className="mb-3 flex flex-wrap gap-1">
            {(
              [
                { k: 'left' as const, label: 'Vľavo' },
                { k: 'center' as const, label: 'Stred' },
                { k: 'right' as const, label: 'Vpravo' },
              ] as const
            ).map(({ k, label }) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setImgPopover((p) => {
                    if (!p) return null
                    applyImageStyle(p.img, p.width, k)
                    return { ...p, align: k }
                  })
                }}
                className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  imgPopover.align === k
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-white/[0.12] text-gray-300 hover:bg-white/[0.06]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-300">Šírka</span>
            <span className="tabular-nums text-sm font-semibold text-white">{imgPopover.width}%</span>
          </div>
          <input
            type="range"
            min={25}
            max={100}
            step={5}
            value={imgPopover.width}
            onChange={(e) => {
              const v = Number(e.target.value)
              setImgPopover((p) => {
                if (!p) return null
                applyImageStyle(p.img, v, p.align)
                return { ...p, width: v }
              })
            }}
            className="mb-3 h-2 w-full cursor-pointer accent-accent"
          />
          <div className="mb-4 flex items-center gap-2">
            <input
              type="number"
              min={25}
              max={100}
              value={imgPopover.width}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                if (!Number.isFinite(n)) return
                const v = Math.min(100, Math.max(25, n))
                setImgPopover((p) => {
                  if (!p) return null
                  applyImageStyle(p.img, v, p.align)
                  return { ...p, width: v }
                })
              }}
              className="input w-20 rounded-lg border border-white/[0.12] bg-white/[0.05] px-2 py-1.5 text-sm text-white"
            />
            <span className="text-xs text-gray-500">% textu</span>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => finalizeImgPopover(true)}
              className="rounded-lg border border-white/[0.12] px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/[0.06]"
            >
              Zrušiť
            </button>
            <button
              type="button"
              onClick={() => finalizeImgPopover(false)}
              className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-[#1a1a1a] hover:opacity-90"
            >
              Hotovo
            </button>
          </div>
        </div>
      ) : null}

      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleQuillChange}
        modules={quillModules}
        formats={formats}
        placeholder={placeholder}
        style={{ minHeight }}
        className="bg-white/[0.06] border border-white/[0.06] rounded-xl"
      />
      <style jsx global>{`
        .blog-editor .ql-container {
          min-height: ${minHeight - 42}px;
          border: none;
          font-size: 15px;
        }
        .blog-editor .ql-toolbar {
          border: none;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          background: rgba(0,0,0,0.25);
          flex-wrap: wrap;
          align-items: flex-end;
          gap: 8px 10px;
          padding: 10px 8px;
        }
        /* Dve samostatné skupiny: najprv „farba písma“, potom „podklad“ */
        .blog-editor .ql-toolbar .ql-formats:has(.ql-color):not(:has(.ql-background)) {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          padding: 6px 10px 8px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .blog-editor .ql-toolbar .ql-formats:has(.ql-color):not(:has(.ql-background))::before {
          content: 'Farba písma (len text, napr. modrá)';
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #c9a96e;
          line-height: 1.2;
          max-width: 12rem;
        }
        .blog-editor .ql-toolbar .ql-formats:has(.ql-background):not(:has(.ql-color)) {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
          padding: 6px 10px 8px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(255,255,255,0.1);
        }
        .blog-editor .ql-toolbar .ql-formats:has(.ql-background):not(:has(.ql-color))::before {
          content: 'Podfarbenie (zvýraznenie – nie farba písma)';
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          color: #9ca3af;
          line-height: 1.2;
          max-width: 14rem;
        }
        .blog-editor .ql-editor {
          color: #e4e4e7;
          line-height: 1.65;
        }
        .blog-editor .ql-editor.ql-blank::before {
          color: #6b7280;
        }
        .blog-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 12px;
          margin: 0.75rem 0;
        }
        .blog-editor .ql-toolbar .ql-stroke {
          stroke: rgba(255,255,255,0.45);
        }
        .blog-editor .ql-toolbar .ql-fill {
          fill: rgba(255,255,255,0.45);
        }
        .blog-editor .ql-toolbar button:hover .ql-stroke,
        .blog-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #c9a96e;
        }
        .blog-editor .ql-toolbar button:hover .ql-fill,
        .blog-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #c9a96e;
        }
        /* Farba / pozadie – viditeľné pickery na tmavom UI */
        .blog-editor .ql-toolbar .ql-picker {
          color: rgba(255,255,255,0.85);
        }
        .blog-editor .ql-toolbar .ql-picker-label {
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 6px;
          padding: 2px 6px;
        }
        .blog-editor .ql-toolbar .ql-picker-label::before {
          color: rgba(255,255,255,0.75);
        }
        .blog-editor .ql-snow .ql-picker.ql-expanded .ql-picker-label {
          border-color: rgba(201, 169, 110, 0.45);
        }
        .blog-editor .ql-snow .ql-picker-options {
          z-index: 10050 !important;
          background: #1c1c1f !important;
          border: 1px solid rgba(255,255,255,0.12) !important;
          border-radius: 10px;
          padding: 8px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.55);
          max-height: 220px;
          overflow-y: auto;
        }
        .blog-editor .ql-snow .ql-color-picker .ql-picker-item,
        .blog-editor .ql-snow .ql-background .ql-picker-item {
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 4px;
          margin: 2px;
        }
        .blog-editor .ql-snow .ql-color-picker .ql-picker-item:hover,
        .blog-editor .ql-snow .ql-background .ql-picker-item:hover {
          border-color: #c9a96e;
          transform: scale(1.05);
        }
      `}</style>
    </div>
  )
}

