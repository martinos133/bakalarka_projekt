/** Zmenší obrázok na JPEG data URL (max rozmer + cieľová veľkosť reťazca pre API). */
export async function fileToResizedAvatarDataUrl(
  file: File,
  opts?: { maxDim?: number; maxChars?: number },
): Promise<string> {
  const maxDim = opts?.maxDim ?? 384
  const maxChars = opts?.maxChars ?? 320_000

  if (!file.type.startsWith('image/')) {
    throw new Error('Vyberte obrázok (JPEG, PNG alebo WebP).')
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const url = reader.result as string
      const img = new Image()
      img.onload = () => {
        try {
          let w = img.width
          let h = img.height
          const ratio = Math.min(maxDim / w, maxDim / h, 1)
          w = Math.max(1, Math.round(w * ratio))
          h = Math.max(1, Math.round(h * ratio))
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas nie je dostupný.'))
            return
          }
          ctx.drawImage(img, 0, 0, w, h)
          let quality = 0.9
          let dataUrl = canvas.toDataURL('image/jpeg', quality)
          while (dataUrl.length > maxChars && quality > 0.45) {
            quality -= 0.07
            dataUrl = canvas.toDataURL('image/jpeg', quality)
          }
          if (dataUrl.length > maxChars) {
            reject(new Error('Obrázok je príliš veľký aj po zmenšení. Skúste menší súbor.'))
            return
          }
          resolve(dataUrl)
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Chyba pri spracovaní obrázka'))
        }
      }
      img.onerror = () => reject(new Error('Nepodarilo sa načítať obrázok.'))
      img.src = url
    }
    reader.onerror = () => reject(new Error('Nepodarilo sa prečítať súbor.'))
    reader.readAsDataURL(file)
  })
}
