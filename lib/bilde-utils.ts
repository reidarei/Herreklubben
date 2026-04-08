export function genererFilnavn(fil: File): string {
  const ext = fil.name.split('.').pop() || 'jpg'
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
}

export async function komprimer(fil: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(fil)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      const maks = 1200
      let { width, height } = img
      if (width > maks || height > maks) {
        if (width > height) {
          height = Math.round((height * maks) / width)
          width = maks
        } else {
          width = Math.round((width * maks) / height)
          height = maks
        }
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Komprimering feilet')); return }
          resolve(new File([blob], fil.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.8
      )
    }
    img.onerror = reject
    img.src = url
  })
}
