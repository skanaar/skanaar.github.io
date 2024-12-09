export function DitherImage({ src, width, height, exposure = 0 }) {
  const canvasRef = React.useRef()

  React.useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const ditherer = new FloydSteinbergDitherer(width, { exposure })
    const image = new Image(width, height)
    image.onload = () => {
      ctx.drawImage(image, 0, 0, width, height)
      ditherer.ditherCanvas(canvas)
    }
    image.src = src
  }, [src, width, height, exposure])

  return React.createElement('canvas',
    { ref: canvasRef, width, height, style: { border: '1px solid black' } }
  )
}

export class FloydSteinbergDitherer {
  errorBuffer = []
  exposure = 0
  constructor(size, { exposure = 0 } = {}) {
    this.errorBuffer = [new Array(size).fill(0), new Array(size).fill(0)]
    this.exposure = exposure
  }
  getValue(value, i, j) {
    if (i === 0){
      let [a, b] = this.errorBuffer
      this.errorBuffer = [b, a.map(() => 0)]
    }
    let [currentRow, nextRow] = this.errorBuffer
    let valueWithDiffusedError = clamp(value + currentRow[i], 0, 1)
    let clamped = (valueWithDiffusedError) > 0.5 ? 1 : 0
    let deviation = (valueWithDiffusedError - clamped) / 16
    if (i+1 < currentRow.length) currentRow[i+1] += deviation * 7
    if (i-1 > 0) nextRow[i-1] += deviation * 3
    nextRow[i] += deviation * 5
    if (i+1 < nextRow.length) nextRow[i+1] += deviation * 1
    return clamped
  }
  monochrome(r, g, b) {
    return 0.21*r + 0.72*g + 0.07*b
  }
  expose(x, amount) {
    let k = (amount+1)/2
    return (1-k) * x*x + k * (2*x-x*x)
  }
  ditherCanvas(canvas) {
    let ctx = canvas.getContext('2d')
    let imgdata = ctx.getImageData(0, 0, canvas.width, canvas.height)
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        let offset = (x + y * canvas.width) * 4
        let bright = this.monochrome(
          imgdata.data[offset],
          imgdata.data[offset + 1],
          imgdata.data[offset + 2]
        )/255
        bright = this.expose(bright, this.exposure)
        let value = Math.floor(this.getValue(bright, x, y) * 255)
        imgdata.data[offset] = value
        imgdata.data[offset + 1] = value
        imgdata.data[offset + 2] = value
        imgdata.data[offset + 3] = 255
      }
    }
    ctx.putImageData(imgdata, 0, 0)
  }
}

function clamp(x, low, high) {
  return Math.max(low, Math.min(x, high))
}
