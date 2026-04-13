'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { default as ReactQuillClass } from 'react-quill-new'
import { Image as ImageIcon, X } from 'lucide-react'

import 'react-quill-new/dist/quill.snow.css'

import { registerSizedImageFormat } from '@/lib/quill-sized-image'

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

function applyImageWidthPct(img: HTMLImageElement, w: number) {
  const v = Math.min(100, Math.max(25, w))
  img.setAttribute('data-img-width', String(v))
  img.setAttribute(
    'style',
    `max-width:${v}%; height:auto; display:block; margin:1rem auto; border-radius:12px;`,
  )
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
  'list', 'blockquote', 'link', 'image',
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
  const [imgPopover, setImgPopover] = useState<ImgPopoverState>(null)
  const quillRef = useRef<InstanceType<typeof ReactQuillClass> | null>(null)
  const imgPopoverRef = useRef<ImgPopoverState>(null)
  imgPopoverRef.current = imgPopover

  const openImageDialog = useCallback((dataUrl: string, insertIndex: number) => {
    setImageWidthPct(100)
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
    quill.insertEmbed(imageModal.insertIndex, 'image', { src: imageModal.dataUrl, width: w })
    quill.setSelection(imageModal.insertIndex + 1)
    setImageModal(null)
  }, [imageModal, imageWidthPct])

  const syncQuillHtml = useCallback(() => {
    const quill = quillRef.current?.getEditor()
    if (!quill) return
    onChange(quill.getSemanticHTML())
  }, [onChange])

  /** revert=true vráti pôvodnú šírku, false uloží aktuálnu (Hotovo / klik mimo) */
  const finalizeImgPopover = useCallback(
    (revert: boolean) => {
      const cur = imgPopoverRef.current
      if (!cur) return
      cur.img.style.outline = ''
      if (revert) {
        applyImageWidthPct(cur.img, cur.initialWidth)
      } else {
        applyImageWidthPct(cur.img, cur.width)
      }
      syncQuillHtml()
      setImgPopover(null)
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

  /** Klik na obrázok v editore → panel na úpravu šírky */
  useEffect(() => {
    if (!mounted || imageModal) return
    const editor = document.querySelector('.blog-editor .ql-editor')
    if (!editor) return

    const placePopover = (img: HTMLImageElement) => {
      const rect = img.getBoundingClientRect()
      return {
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 308)),
      }
    }

    const onEditorClick = (e: Event) => {
      const t = e.target as HTMLElement
      if (t.tagName !== 'IMG' || !editor.contains(t)) return
      e.stopPropagation()
      const img = t as HTMLImageElement
      const w = readImageWidthPct(img)
      const curOpen = imgPopoverRef.current
      if (curOpen?.img === img) {
        curOpen.img.style.outline = ''
        applyImageWidthPct(curOpen.img, curOpen.width)
        syncQuillHtml()
        setImgPopover(null)
        return
      }
      const prev = imgPopoverRef.current
      if (prev && prev.img !== img) {
        prev.img.style.outline = ''
        applyImageWidthPct(prev.img, prev.width)
        syncQuillHtml()
      }
      img.style.outline = '2px solid #c9a96e'
      const { top, left } = placePopover(img)
      setImgPopover({ img, width: w, initialWidth: w, top, left })
    }

    editor.addEventListener('click', onEditorClick, true)
    return () => editor.removeEventListener('click', onEditorClick, true)
  }, [mounted, imageModal, value, syncQuillHtml])

  useEffect(() => {
    if (!imgPopover) return
    const onDocDown = (e: Event) => {
      const el = e.target as HTMLElement
      if (imgPopover.img.contains(el)) return
      if (el.closest('#rte-img-edit-popover')) return
      finalizeImgPopover(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finalizeImgPopover(true)
    }
    const onScrollOrResize = () => {
      const cur = imgPopoverRef.current
      if (!cur) return
      const rect = cur.img.getBoundingClientRect()
      const top = rect.bottom + 8
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - 308))
      setImgPopover((p) => (p ? { ...p, top, left } : null))
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
  }, [imgPopover, finalizeImgPopover])

  useLayoutEffect(() => {
    if (!imgPopover) return
    const rect = imgPopover.img.getBoundingClientRect()
    const top = rect.bottom + 8
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 308))
    setImgPopover((p) => (p && p.img === imgPopover.img ? { ...p, top, left } : p))
  }, [imgPopover?.width, imgPopover?.img])

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

      {imgPopover ? (
        <div
          id="rte-img-edit-popover"
          role="dialog"
          aria-label="Úprava šírky obrázka"
          className="fixed z-[20001] w-[min(calc(100vw-16px),300px)] rounded-xl border border-white/[0.12] bg-[#1a1a1c] p-4 shadow-2xl"
          style={{ top: imgPopover.top, left: imgPopover.left }}
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-accent">Úprava obrázka</p>
          <p className="mb-2 text-xs text-gray-400">
            Uprav šírku v článku. Hotovo uloží zmeny; Zruší vráti pôvodné.
          </p>
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
                applyImageWidthPct(p.img, v)
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
                  applyImageWidthPct(p.img, v)
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
        onChange={onChange}
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

