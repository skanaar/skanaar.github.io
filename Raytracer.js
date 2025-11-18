import { el, App, useEvent } from './assets/system.js'
import { FloydSteinbergDitherer, NoDitherer } from './raytracer/dither.js'
import {
  Plane,
  Sphere,
  Light,
  HeightMap,
  Sun,
  compileScene,
  BezierPatchSet,
  Offset,
  Scaling,
  Rotate,
  Lathe,
  BezierLathe,
} from './raytracer/geometry.js'
import { Vec, norm } from './raytracer/math.js'
import { raytraceParallel } from './raytracer/raytraceParallel.js'
import { teapotPatches } from './raytracer/teapot.js'
import { SceneView, SceneObjects, Properties } from './raytracer/SceneView.js'

export const app = new App('RayTracer', RayTracer, 'aperture.svg')
app.addToAppMenu({
  title: 'Show options...',
  event: 'app:show_child_window',
  arg: 'Options',
  cmd: 'i',
})
app.addMenu(
  'File',
  { title: 'Teapot', event: 'scene', arg: 'teapot' },
  { title: 'Island', event: 'scene', arg: 'island' },
  { title: 'Mushroom', event: 'scene', arg: 'mushroom' },
)
app.addMenu(
  'View',
  { title: 'Front', event: 'scene_view', arg: 'front' },
  { title: 'Side', event: 'scene_view', arg: 'side' },
  { title: 'Top', event: 'scene_view', arg: 'top' },
)
app.check('scene_view', 'front')
app.addWindow('Options', RenderOptions, {
  visible: true,
  offset: [256+20,0],
  size: [200,100]
})
app.addWindow('Scene Objects', SceneObjects, {
  visible: true,
  offset: [0, 256+40],
  size: [200,300],
  sizing: 'noresize'
})
app.addWindow('Properties', Properties, {
  visible: true,
  offset: [256+20, 100+40],
  size: [200,100],
  sizing: 'noresize'
})
app.addWindow('Scene View', SceneView, {
  visible: true,
  offset: [220, 256+40],
  size: [400,300],
  sizing: 'noresize'
})

let size = 256
let ditherMethod = 'none' //'floydsteinberg'
let maxDepth = 3

export let scene = []

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
    BezierPatchSet('teapot',
      teapotPatches,
      3,
      [Offset(120,256,-80), Scaling(40,40,40), Rotate(Math.PI/2, 0, 0.5)]
    ),
    Lathe("column",
      16,
      [
        Vec(45,0,-100), Vec(45,0,-80), Vec(40,0,-75),
        Vec(40,0,75), Vec(45,0,80), Vec(45,0,100)
      ],
      [Offset(40,128,-80), Scaling(0.5,0.5,0.5), Rotate(Math.PI/2,0,0.5)]
    )
  ]
}

function sceneIsland() {
  return [
    Sun(Vec(-1, 1, -0.5), 2),
    Plane(Vec(0,0,0), norm(Vec(0,1,0.01))),
    Plane(Vec(0,255,0), norm(Vec(0,-1,0.01))),
    HeightMap(
      'island',
      { res: 32, size: 256, height: 0, bump: 64 },
      [Offset(128,200,-128), Rotate(3.14-0.2, -0.3, 0)]
    )
  ]
}

function sceneMushroom() {
  return [
    Sun(Vec(-1, 1, -0.5), 2),
    Sun(Vec(1, -1, -0.5), 0.5),
    BezierLathe('mushroom-foot',
      32, 16,
      [Vec(20,0,0), Vec(30,0,0), Vec(30,0,20), Vec(25,0,50)],
      [Offset(128,200,-80), Scaling(2,2,2), Rotate(3.14/2,0,0), Rotate(0,0,0.1)]
    ),
    Lathe('mushroom-gills',
      32,
      [Vec(25,0,50), Vec(50,0,50)],
      [Offset(128,200,-80), Scaling(2,2,2), Rotate(3.14/2,0,0), Rotate(0,0,0.1)]
    ),
    BezierLathe('mushroom-hat',
      32, 16,
      [Vec(50,0,50), Vec(50,0,80), Vec(15,0,90), Vec(1,0,90)],
      [Offset(128,200,-80), Scaling(2,2,2), Rotate(3.14/2,0,0), Rotate(0,0,0.1)]
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

  useEvent(app, 'scene', apply((arg) => {
    app.check('scene', arg)
    scene = {
      teapot: sceneTeapot(),
      island: sceneIsland(),
      mushroom: sceneMushroom(),
    }[arg]
    app.trigger('update-scene', scene)
  }))
  useEvent(app, 'dither', apply((arg) => { ditherMethod = arg }))
  useEvent(app, 'maxdepth', apply((arg) => { maxDepth = arg }))

  React.useEffect(() => {
    setTimeout(() => {
      scene = sceneTeapot()
      app.trigger('scene', 'teapot')
    }, 0)
  }, [])

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
