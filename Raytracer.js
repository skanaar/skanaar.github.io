import { el, App, useEvent } from './assets/system.js'
import { FloydSteinbergDitherer, NoDitherer } from './raytracer/dither.js'
import {
  Plane,
  Sphere,
  Light,
  bezierMesh,
  wave,
  heightMap,
  Sun,
  compileScene,
  bezierPathes,
} from './raytracer/geometry.js'
import {
  RotateX,
  RotateY,
  RotateZ,
  Scale,
  Translate,
  Vec,
  matrixStack,
  norm
} from './raytracer/math.js'
import { raytraceParallel } from './raytracer/raytraceParallel.js'
import { teapotPatches } from './raytracer/teapot.js'
import { SceneView, SceneObjects } from './raytracer/SceneView.js'

export const app = new App('RayTracer', RayTracer, 'aperture.svg')
app.addToAppMenu({
  title: 'Show options...',
  event: 'app:show_child_window',
  arg: 'Options',
  cmd: 'i',
})
app.addMenu(
  'Scene',
  { title: 'Teapot', event: 'scene', arg: 'teapot' },
  { title: 'Wave', event: 'scene', arg: 'wave' },
  { title: 'Island', event: 'scene', arg: 'island' },
)
app.addWindow('Options', RenderOptions, {
  visible: true,
  offset: [256+20,0],
  size: [200,100]
})
app.addWindow('Scene View', SceneView, {
  visible: true,
  offset: [220, 256+40],
  size: [400,300],
  sizing: 'noresize'
})
app.addWindow('Scene Objects', SceneObjects, {
  visible: true,
  offset: [0, 256+40],
  size: [200,300],
  sizing: 'noresize'
})

let size = 256
let ditherMethod = 'none' //'floydsteinberg'
let maxDepth = 3

export let scene = sceneIsland()
app.check('scene', 'island')

function sceneCommons() {
  return [
    Light(Vec(32, 32, -256+32), 16),
    Light(Vec(200, 50, 128), 150),
    Plane(Vec(0,0,0), norm(Vec(1,0,0.01))),
    Plane(Vec(0,0,0), norm(Vec(0,1,0.01))),
    Plane(Vec(0,255,0), norm(Vec(0,-1,0.01))),
    Plane(Vec(255,0,0), norm(Vec(-1,0,0.01))),
    Plane(Vec(0,0,-255), norm(Vec(0,0,1.01))),
  ]
}

function sceneTeapot() {
  return [
    ...sceneCommons(),
    Sphere('Mirror', Vec(128+50, 128-50, -120), 64, 'mirror'),
    bezierPathes('teapot',
      teapotPatches,
      3,
      [Translate(120,256,-80), Scale(40,40,40), RotateX(1.5), RotateZ(0.5)]
    )
  ]
}

function sceneWave() {
  return [
    ...sceneCommons(),
    Sphere('Drop', Vec(128, 80, 0), 32, 'diffuse'),
    Sphere('Drop', Vec(128, 148, 0), 8, 'diffuse'),
    ...wave(
      { res: 20, size: 256, periods: 3, height: 40 },
      matrixStack(Translate(0,220,128), RotateX(3), RotateZ(0))
    )
  ]
}

function sceneIsland() {
  return [
    Sun(Vec(-1, 1, -0.5), 2),
    Plane(Vec(0,0,0), norm(Vec(0,1,0.01))),
    Plane(Vec(0,255,0), norm(Vec(0,-1,0.01))),
    heightMap(
      'island',
      { res: 32, size: 256, height: 0, bump: 64 },
      [Translate(128,200,-128), RotateX(3.14-0.2), RotateY(-0.3)]
    )
  ]
}

function RayTracer() {
  const hostRef = React.useRef()
  const apply = (action) => (arg, event) => {
    action(arg, event)

    let ditherer = {
      floydsteinberg: new FloydSteinbergDitherer(),
      none: new NoDitherer(),
    }[ditherMethod]

    raytraceParallel({
      canvas: hostRef.current,
      size,
      maxDepth,
      scene: compileScene(scene),
      ditherer,
    }).then((result) => app.trigger('done', result))
  }
  let render = apply(() => null)

  React.useEffect(() => {
    render()
  }, [])

  useEvent(app, 'scene', apply((arg) => {
    app.check('scene', arg)
    if (arg == 'wave') scene = sceneWave()
    else if (arg == 'teapot') scene = sceneTeapot()
    else if (arg == 'island') scene = sceneIsland()
    app.trigger('update-scene', scene)
  }))
  useEvent(app, 'dither', apply((arg) => { ditherMethod = arg }))
  useEvent(app, 'maxdepth', apply((arg) => { maxDepth = arg }))

  return el('canvas', { width: size, height: size, ref: hostRef })
}

function RenderOptions() {
  const [reflections, setReflections] = React.useState(maxDepth)
  const [dither, setDither] = React.useState(ditherMethod)
  const [duration, setDuration] = React.useState(0)
  useEvent(app, 'maxdepth', (arg) => setReflections(arg))
  useEvent(app, 'dither', (arg) => setDither(arg))
  useEvent(app, 'done', (arg) => setDuration(arg.duration))

  return el(
    'div',
    { style: { display: 'flex', flexDirection: 'column', margin: 10 } },
    el('label', {},
      el('input', {
        type: 'checkbox',
        checked: reflections > 0,
        onChange: (e) => app.trigger('maxdepth', e.target.checked ? 3 : 0),
      }),
      'Reflections'
    ),
    el('label', {},
      el('input', {
        type: 'checkbox',
        checked: dither == 'floydsteinberg',
        onChange: (e) => {
          app.trigger('dither', e.target.checked ? 'floydsteinberg' : 'none')
        },
      }),
      'Dither'
    ),
    `Duration: ${duration.toFixed(0)}ms`
  )
}
