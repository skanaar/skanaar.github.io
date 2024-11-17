import { el, App } from './assets/system.js'

export const app = new App('Hilbert', Hilbert, 'hilbert.svg')

let curve = [...hilbert([0,0], [63,0], 64)]

function Hilbert() {
  const [time, setTime] = React.useState(0)
  const hostRef = React.useRef()

  React.useEffect(() => {
    const handle = setInterval(() => setTime(t => t+1), 5)
    return () => clearInterval(handle)
  }, [])

  React.useEffect(() => {
    let ctx = hostRef.current.getContext('2d')
    ctx.scale(4,4)
    ctx.translate(0.5,0.5)
    ctx.lineWidth = 0.25
  }, [])

  React.useEffect(() => {
    let ctx = hostRef.current.getContext('2d')
    ctx.strokeStyle = '#000'
    if (time < curve.length-1){
      let [x,y] = curve[time]
      let [x2,y2] = curve[time+1]
      ctx.beginPath()
      ctx.moveTo(x,y)
      ctx.lineTo(x2,y2)
      ctx.stroke()
    }
    else {
      setTime(0)
    }
  }, [time])


  return el('canvas', { width: 256, height: 256, ref: hostRef })
}

function diff2([a, b], [x, y]) {
  return [a - x, b - y]
}
function addWeighted(a, K, b, L, c) {
  return [a[0] + K*b[0] + L*c[0], a[1] + K*b[1] + L*c[1]]
}
function norm2([x, y]) {
  return [Math.sign(x), Math.sign(y)]
}

export function* hilbert(a, d, size) {
  let u_norm = norm2(diff2(d, a))
  let v_norm = [u_norm[1], u_norm[0]]
  let s0 = size/2 - 1
  let s1 = size/2
  let end = size-1
  if (size === 2) {
    yield a
    yield addWeighted(a, 0, u_norm, 1, v_norm)
    yield addWeighted(a, 1, u_norm, 1, v_norm)
    yield addWeighted(a, 1, u_norm, 0, v_norm)
  }
  else {
    yield* hilbert(
      addWeighted(a, 0, u_norm, 0, v_norm),
      addWeighted(a, 0, u_norm, s0, v_norm),
      size/2
    )
    yield* hilbert(
      addWeighted(a, 0, u_norm, s1, v_norm),
      addWeighted(a, s0, u_norm, s1, v_norm),
      size/2
    )
    yield* hilbert(
      addWeighted(a, s1, u_norm, s1, v_norm),
      addWeighted(a, end, u_norm, s1, v_norm),
      size/2
    )
    yield* hilbert(
      addWeighted(a, end, u_norm, s0, v_norm),
      addWeighted(a, end, u_norm, 0, v_norm),
      size/2
    )
  }
}
