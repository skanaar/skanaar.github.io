let chunkSize = 16

export function raytraceParallel({ canvas, size, maxDepth, scene, ditherer }) {
  let { promise, resolve } = Promise.withResolvers()
  let ctx = canvas.getContext("2d")
  let start = performance.now()

  let chunkCount = size/chunkSize
  let pendingWorkers = chunkCount
  let progress = 0
  let chunks = new Array(chunkCount)

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeRect(size/2-20, size/2-2, 40, 4)
  ctx.fillStyle = '#000'

  function onComplete() {
    resolve({ duration: performance.now() - start })
    let imgdata = ctx.createImageData(size, size)
    for (let { x, y } of ditherer.coordinates(size)) {
      let j = y % chunkSize
      let bright = chunks[Math.floor((y) / chunkSize)].data[4 * (x + j*size)]
      let value = Math.floor(ditherer.apply(bright/255, { x, y }) * 255)
      let offset = (x + y*size)*4
      imgdata.data[offset] = value
      imgdata.data[offset + 1] = value
      imgdata.data[offset + 2] = value
      imgdata.data[offset + 3] = 255
    }
    ctx.putImageData(imgdata, 0, 0)
  }

  for (let i = 0; i < chunkCount; i++) {
    const worker = new Worker('/raytracer/raytrace.worker.js', {type:'module'})
    worker.onmessage = (e) => {
      if (e.data.progress == 'row_complete') {
        progress += 1/size
        ctx.fillRect(size/2-20, size/2-2, 40*progress, 4)
        return
      }
      chunks[i] = e.data
      pendingWorkers--
      if (pendingWorkers === 0) onComplete()
    }
    let totalArea = { width: size, height: size }
    let area = { width: size, height: chunkSize, x: 0, y: i*chunkSize }
    worker.postMessage({ area, totalArea, size, maxDepth, scene })
  }

  return promise
}
