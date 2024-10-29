import { el, App, useEvent } from './assets/system.js'

export const app = new App('RayTracer', RayTracer, 'aperture.svg', [256, 256], 'autosize')

app.addMenu(
  'Scene',
  { title: 'Add light', event: 'add-light' },
  { title: 'Remove light', event: 'remove-light' },
)

let conf = null

function RayTracer() {
  const hostRef = React.useRef()

  React.useEffect(() => {
    raytrace(hostRef.current, w, spheres, lights)
  }, [])

  useEvent(app, 'add-light', () => {
    lights.push([rnd(), rnd(), rnd()])
    raytrace(hostRef.current, w, spheres, lights)
  })
  useEvent(app, 'remove-light', () => {
    lights.pop()
    raytrace(hostRef.current, w, spheres, lights)
  })

  return el('canvas', {
    width: 256,
    height: 256,
    ref: hostRef
  })
}

let rnd = (t = 255) => t * Math.random();

let w = 256;
let lights = [[256, 0, 256]];
let spheres = [];
for (let i = 0; i < 32; i++)
  spheres.push([[rnd(), rnd(), rnd()], rnd(50), [rnd(), rnd(), rnd()]]);

let diff = ([a, b, c], [x, y, z]) => [a - x, b - y, c - z];
let dot = ([a, b, c], [x, y, z]) => a * x + b * y + c * z;
let mag = ([a, b, c]) => Math.sqrt(a * a + b * b + c * c);
let div = ([a, b, c], k) => [a / k, b / k, c / k];
let norm = (v) => div(v, mag(v));
let sq = (x) => x * x;

function raytrace(canvas, w, spheres, lights) {
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < w; i++)
    for (let j = 0; j < w; j++) {
      let depth = -1000;
      let color = [0, 0, 0];
      for (let [[x, y, z], r, [cr, cg, cb]] of spheres) {
        if (sq(i - x) + sq(j - y) > r * r) continue;
        let k = Math.sqrt(r * r - sq(i - x) - sq(j - y)) + z;
        let p = [i, j, k];
        if (k < depth) continue;
        depth = k;
        let bright = 0;
        for (let light of lights) {
          let light_dir = norm(diff(light, p));
          const surface_normal = norm(diff(p, [x, y, z]));
          bright += Math.max(0, dot(surface_normal, light_dir));
        }
        color = [cr * bright, cg * bright, cb * bright];
      }
      ctx.fillStyle = `rgb(${color.join()})`;
      ctx.fillRect(i, j, 1, 1);
    }
}
