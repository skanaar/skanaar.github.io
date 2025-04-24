export async function imageFileToDataUrl(file, { width, height }) {
  var imgUrl = URL.createObjectURL(file)
  var img = await loadImage(imgUrl)
  return getDataUrl(img, width, height)
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    let img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', () => reject(new Error('failed to load image')))
    img.src = url
  })
}

function getDataUrl(img, width, height) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  // canvas.width = img.width
  // canvas.height = img.height
  canvas.width = width
  canvas.height = height
  ctx.scale(width/img.width, width/img.width)
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.6)
}
