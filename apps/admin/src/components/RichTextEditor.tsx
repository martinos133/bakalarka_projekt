'use client'

import dynamic from 'next/dynamic'
import { useRef, useEffect, useState } from 'react'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

import 'react-quill-new/dist/quill.snow.css'

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB

function imageHandler(this: any) {
  const quill = this.quill
  const input = document.createElement('input')
  input.setAttribute('type', 'file')
  input.setAttribute('accept', 'image/*')
  input.onchange = () => {
    const file = input.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_SIZE) {
      alert('Obrázok môže mať max. 2 MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      if (!result || result.length > 5_000_000) {
        alert('Obrázok je príliš veľký')
        return
      }
      const range = quill.getSelection(true)
      quill.insertEmbed(range.index, 'image', result)
      quill.setSelection(range.index + 1)
    }
    reader.readAsDataURL(file)
    input.value = ''
  }
  input.click()
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'link', 'image'],
    [{ color: [] }, { background: [] }],
    ['clean'],
  ],
  clipboard: {
    matchVisual: false,
  },
}

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'blockquote', 'link', 'image',
  'color', 'background',
]

const quillModules = {
  ...modules,
  toolbar: {
    container: modules.toolbar as any,
    handlers: {
      image: imageHandler,
    },
  },
}

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  className?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Napíšte obsah...',
  minHeight = 320,
  className = '',
}: RichTextEditorProps) {
  const quillRef = useRef<any>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className={`bg-white/[0.04] border border-white/[0.06] rounded-xl ${className}`}
        style={{ minHeight, padding: 16 }}
      >
        <div className="text-gray-500">Načítavam editor...</div>
      </div>
    )
  }

  return (
    <div className={`blog-editor ${className}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={quillModules}
        formats={formats}
        placeholder={placeholder}
        style={{ minHeight }}
        className="bg-white/[0.04] border border-white/[0.06] rounded-xl"
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
          background: rgba(0,0,0,0.2);
        }
        .blog-editor .ql-editor {
          color: #fff;
        }
        .blog-editor .ql-editor.ql-blank::before {
          color: #6b7280;
        }
        .blog-editor .ql-toolbar .ql-stroke {
          stroke: rgba(255,255,255,0.3);
        }
        .blog-editor .ql-toolbar .ql-fill {
          fill: rgba(255,255,255,0.3);
        }
        .blog-editor .ql-toolbar button:hover .ql-stroke,
        .blog-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #1dbf73;
        }
        .blog-editor .ql-toolbar button:hover .ql-fill,
        .blog-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #1dbf73;
        }
      `}</style>
    </div>
  )
}

